
-- Fix: restrict participant insert to only allow inserting for own student record
DROP POLICY "Authenticated users can join challenges" ON public.challenge_participants;
CREATE POLICY "Authenticated users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (
  student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid())
  OR challenge_id IN (SELECT id FROM public.challenges WHERE professor_id = auth.uid())
);
