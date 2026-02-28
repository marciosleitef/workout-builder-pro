
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.workout_journeys(id) ON DELETE CASCADE NOT NULL,
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  day_label TEXT NOT NULL DEFAULT '',
  orientations TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can view own workouts" ON public.workouts FOR SELECT USING (auth.uid() = professor_id);
CREATE POLICY "Professors can insert own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = professor_id);
CREATE POLICY "Professors can update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = professor_id);
CREATE POLICY "Professors can delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = professor_id);

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
