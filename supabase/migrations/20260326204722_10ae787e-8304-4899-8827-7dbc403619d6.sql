CREATE POLICY "Students can notify their professor"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT s.professor_id
    FROM students s
    WHERE s.user_id = auth.uid()
  )
);