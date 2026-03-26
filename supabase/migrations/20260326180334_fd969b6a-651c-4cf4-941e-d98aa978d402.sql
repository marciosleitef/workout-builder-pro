
-- Daily health records
CREATE TABLE public.student_daily_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  height NUMERIC,
  weight NUMERIC,
  bmi NUMERIC,
  oxygen_saturation NUMERIC,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  hydration_level TEXT,
  sleep_hours NUMERIC,
  resting_bpm INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, recorded_at)
);

ALTER TABLE public.student_daily_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own daily records" ON public.student_daily_records
  FOR ALL TO public
  USING (auth.uid() = professor_id)
  WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Students can view own daily records" ON public.student_daily_records
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

-- Workout session feedback (pre/post workout)
CREATE TABLE public.workout_session_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL,
  workout_checkin_id UUID REFERENCES public.workout_checkins(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('pre', 'post')),
  -- Pre-workout scales (1-5 or 0-10)
  fatigue_scale INTEGER,
  sleep_quality_scale INTEGER,
  muscle_soreness_scale INTEGER,
  stress_level_scale INTEGER,
  mood_scale INTEGER,
  recovery_perception_scale INTEGER,
  urine_color_scale INTEGER,
  -- Post-workout scales
  post_recovery_scale INTEGER,
  perceived_exertion_scale INTEGER,
  pain_scale_eva INTEGER,
  -- Workout metrics
  workout_bpm_avg INTEGER,
  workout_bpm_max INTEGER,
  calories_burned INTEGER,
  -- Checkin/checkout times
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own session feedback" ON public.workout_session_feedback
  FOR ALL TO public
  USING (auth.uid() = professor_id)
  WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Students can manage own session feedback" ON public.workout_session_feedback
  FOR ALL TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
