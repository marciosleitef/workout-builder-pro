
CREATE TABLE public.workout_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  orientations TEXT DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT '',
  student_can_view BOOLEAN DEFAULT true,
  hide_on_expire BOOLEAN DEFAULT true,
  hide_until_start BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view own journeys" ON public.workout_journeys FOR SELECT USING (auth.uid() = professor_id);
CREATE POLICY "Professors can insert own journeys" ON public.workout_journeys FOR INSERT WITH CHECK (auth.uid() = professor_id);
CREATE POLICY "Professors can update own journeys" ON public.workout_journeys FOR UPDATE USING (auth.uid() = professor_id);
CREATE POLICY "Professors can delete own journeys" ON public.workout_journeys FOR DELETE USING (auth.uid() = professor_id);

CREATE TRIGGER update_workout_journeys_updated_at BEFORE UPDATE ON public.workout_journeys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
