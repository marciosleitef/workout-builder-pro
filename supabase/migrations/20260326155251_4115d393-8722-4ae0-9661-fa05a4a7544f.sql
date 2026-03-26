
-- Create student_groups table for professor-defined groups
CREATE TABLE public.student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage own groups" ON public.student_groups FOR ALL USING (auth.uid() = professor_id) WITH CHECK (auth.uid() = professor_id);

-- Add new columns to students
ALTER TABLE public.students
  ADD COLUMN birth_date DATE,
  ADD COLUMN whatsapp TEXT,
  ADD COLUMN gender TEXT,
  ADD COLUMN group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL;
