
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'reminder',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Water intake table
CREATE TABLE public.water_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  glasses integer NOT NULL DEFAULT 0,
  goal integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own water intake"
  ON public.water_intake FOR ALL TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

CREATE POLICY "Professors can view student water intake"
  ON public.water_intake FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.professor_id = auth.uid()));

-- Also allow students to insert their own daily records
CREATE POLICY "Students can insert own daily records"
  ON public.student_daily_records FOR INSERT TO authenticated
  WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

CREATE POLICY "Students can update own daily records"
  ON public.student_daily_records FOR UPDATE TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
