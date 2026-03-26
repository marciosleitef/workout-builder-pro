
-- Function to calculate challenge points on checkin
CREATE OR REPLACE FUNCTION public.calculate_challenge_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_participant RECORD;
  v_challenge RECORD;
  v_checkin_date date;
  v_consecutive_days integer;
  v_week_start date;
  v_week_checkins integer;
  v_points_earned integer;
BEGIN
  -- Get the checkin date
  v_checkin_date := (NEW.checked_in_at AT TIME ZONE 'UTC')::date;

  -- Find all challenge participations for this student that have a journey matching this checkin
  FOR v_participant IN
    SELECT cp.id AS participant_id, cp.challenge_id, cp.journey_id
    FROM challenge_participants cp
    WHERE cp.student_id = NEW.student_id
      AND cp.journey_id = NEW.journey_id
  LOOP
    -- Get challenge config
    SELECT * INTO v_challenge FROM challenges WHERE id = v_participant.challenge_id;
    
    -- Skip if challenge not active or outside date range
    IF v_challenge.status != 'active' 
       OR v_checkin_date < v_challenge.start_date 
       OR v_checkin_date > v_challenge.end_date THEN
      CONTINUE;
    END IF;

    -- 1) Points per checkin
    v_points_earned := v_challenge.points_per_checkin;
    INSERT INTO challenge_scores (challenge_id, participant_id, score_type, points, description, earned_at)
    VALUES (v_participant.challenge_id, v_participant.participant_id, 'checkin', v_points_earned, 'Check-in de treino', NEW.checked_in_at);

    -- 2) Streak bonus: count consecutive days ending today
    WITH daily_checkins AS (
      SELECT DISTINCT (wc.checked_in_at AT TIME ZONE 'UTC')::date AS d
      FROM workout_checkins wc
      JOIN challenge_participants cp2 ON cp2.journey_id = wc.journey_id AND cp2.student_id = wc.student_id
      WHERE cp2.id = v_participant.participant_id
        AND (wc.checked_in_at AT TIME ZONE 'UTC')::date <= v_checkin_date
      ORDER BY d DESC
    ),
    streak AS (
      SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int AS grp
      FROM daily_checkins
    )
    SELECT COUNT(*) INTO v_consecutive_days
    FROM streak
    WHERE grp = (SELECT grp FROM streak WHERE d = v_checkin_date LIMIT 1);

    IF v_consecutive_days >= 2 THEN
      INSERT INTO challenge_scores (challenge_id, participant_id, score_type, points, description, earned_at)
      VALUES (v_participant.challenge_id, v_participant.participant_id, 'streak', v_challenge.points_streak_bonus, 
              v_consecutive_days || ' dias consecutivos', NEW.checked_in_at);
      v_points_earned := v_points_earned + v_challenge.points_streak_bonus;
    END IF;

    -- 3) Weekly bonus: if this is the 5th+ unique day this week
    v_week_start := date_trunc('week', v_checkin_date)::date;
    SELECT COUNT(DISTINCT (wc.checked_in_at AT TIME ZONE 'UTC')::date) INTO v_week_checkins
    FROM workout_checkins wc
    JOIN challenge_participants cp3 ON cp3.journey_id = wc.journey_id AND cp3.student_id = wc.student_id
    WHERE cp3.id = v_participant.participant_id
      AND (wc.checked_in_at AT TIME ZONE 'UTC')::date >= v_week_start
      AND (wc.checked_in_at AT TIME ZONE 'UTC')::date <= v_week_start + 6;

    IF v_week_checkins = 5 THEN
      INSERT INTO challenge_scores (challenge_id, participant_id, score_type, points, description, earned_at)
      VALUES (v_participant.challenge_id, v_participant.participant_id, 'weekly', v_challenge.points_weekly_bonus, 
              'Bônus semanal (5 dias)', NEW.checked_in_at);
      v_points_earned := v_points_earned + v_challenge.points_weekly_bonus;
    END IF;

    -- Update total points
    UPDATE challenge_participants 
    SET total_points = total_points + v_points_earned
    WHERE id = v_participant.participant_id;

  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on workout_checkins
CREATE TRIGGER trg_challenge_points
  AFTER INSERT ON public.workout_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_challenge_points();
