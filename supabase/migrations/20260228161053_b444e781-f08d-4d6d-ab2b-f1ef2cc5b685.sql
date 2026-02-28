
-- Add JSONB column to store the full workout exercise data (groups, items, bisets, params)
ALTER TABLE public.workouts ADD COLUMN exercises_data jsonb DEFAULT '[]'::jsonb;
