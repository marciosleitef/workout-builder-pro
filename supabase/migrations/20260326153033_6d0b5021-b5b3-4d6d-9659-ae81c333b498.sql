
-- Table for workout check-ins (attendance tracking)
CREATE TABLE public.workout_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.workout_journeys(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in_by UUID NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_checkins ENABLE ROW LEVEL SECURITY;

-- Professors can manage check-ins for their students
CREATE POLICY "Professors can view own checkins" ON public.workout_checkins
  FOR SELECT USING (auth.uid() = professor_id);

CREATE POLICY "Professors can insert checkins" ON public.workout_checkins
  FOR INSERT WITH CHECK (auth.uid() = professor_id OR auth.uid() = checked_in_by);

CREATE POLICY "Professors can delete own checkins" ON public.workout_checkins
  FOR DELETE USING (auth.uid() = professor_id);

-- Students can view and insert their own check-ins
CREATE POLICY "Students can view own checkins" ON public.workout_checkins
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  );

CREATE POLICY "Students can insert own checkins" ON public.workout_checkins
  FOR INSERT TO authenticated WITH CHECK (
    student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  );
