
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id uuid;

-- Allow students to view their own student record
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Allow students to view journeys assigned to them
CREATE POLICY "Students can view own journeys" ON public.workout_journeys
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Allow students to view workouts assigned to them
CREATE POLICY "Students can view own workouts" ON public.workouts
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));
