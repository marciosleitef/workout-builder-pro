
-- Tabela de desafios
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  source_journey_id uuid REFERENCES public.workout_journeys(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days'),
  status text NOT NULL DEFAULT 'draft',
  invite_code text NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  points_per_checkin integer NOT NULL DEFAULT 10,
  points_weekly_bonus integer NOT NULL DEFAULT 25,
  points_streak_bonus integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de participantes do desafio
CREATE TABLE public.challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  journey_id uuid REFERENCES public.workout_journeys(id) ON DELETE SET NULL,
  total_points integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, student_id)
);

-- Tabela de log de pontuações
CREATE TABLE public.challenge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.challenge_participants(id) ON DELETE CASCADE,
  score_type text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  earned_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_scores ENABLE ROW LEVEL SECURITY;

-- Challenges: professor gerencia os seus
CREATE POLICY "Professors can manage own challenges" ON public.challenges FOR ALL USING (auth.uid() = professor_id) WITH CHECK (auth.uid() = professor_id);
-- Challenges: qualquer um pode ver (para link público)
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT USING (true);

-- Participants: professor vê participantes dos seus desafios
CREATE POLICY "Professors can manage participants" ON public.challenge_participants FOR ALL USING (
  challenge_id IN (SELECT id FROM public.challenges WHERE professor_id = auth.uid())
) WITH CHECK (
  challenge_id IN (SELECT id FROM public.challenges WHERE professor_id = auth.uid())
);
-- Participants: qualquer autenticado pode se inscrever
CREATE POLICY "Authenticated users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (true);
-- Participants: qualquer um pode ver (ranking público)
CREATE POLICY "Anyone can view participants" ON public.challenge_participants FOR SELECT USING (true);

-- Scores: professor gerencia
CREATE POLICY "Professors can manage scores" ON public.challenge_scores FOR ALL USING (
  challenge_id IN (SELECT id FROM public.challenges WHERE professor_id = auth.uid())
) WITH CHECK (
  challenge_id IN (SELECT id FROM public.challenges WHERE professor_id = auth.uid())
);
-- Scores: qualquer um pode ver (ranking público)
CREATE POLICY "Anyone can view scores" ON public.challenge_scores FOR SELECT USING (true);
