
-- Payments table for tracking student payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own payments"
ON public.payments FOR ALL
TO authenticated
USING (auth.uid() = professor_id)
WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Students can view own payments"
ON public.payments FOR SELECT
TO authenticated
USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
