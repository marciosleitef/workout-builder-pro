
-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  periodicity text NOT NULL DEFAULT 'monthly',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own plans" ON public.plans FOR ALL TO public
  USING (auth.uid() = professor_id)
  WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Anyone can view plans by professor" ON public.plans FOR SELECT TO public
  USING (true);

-- Add plan_id and payment_day to students
ALTER TABLE public.students
  ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  ADD COLUMN payment_day integer;

-- Bioimpedance table
CREATE TABLE public.student_bioimpedance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  professor_id uuid NOT NULL,
  measured_at date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric(5,2),
  body_fat_pct numeric(5,2),
  lean_mass numeric(5,2),
  muscle_mass numeric(5,2),
  visceral_fat numeric(5,2),
  basal_metabolism numeric(7,2),
  body_water_pct numeric(5,2),
  bone_mass numeric(5,2),
  file_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_bioimpedance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own bioimpedance" ON public.student_bioimpedance FOR ALL TO public
  USING (auth.uid() = professor_id)
  WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Students can view own bioimpedance" ON public.student_bioimpedance FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
