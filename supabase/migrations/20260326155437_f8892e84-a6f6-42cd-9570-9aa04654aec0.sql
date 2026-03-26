
CREATE POLICY "Anyone can view groups by professor" ON public.student_groups FOR SELECT USING (true);
