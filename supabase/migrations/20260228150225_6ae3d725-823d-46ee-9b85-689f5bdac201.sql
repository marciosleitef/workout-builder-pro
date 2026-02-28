
-- Create storage bucket for exercise videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-videos', 'exercise-videos', true);

-- Allow anyone to view exercise videos (public bucket)
CREATE POLICY "Exercise videos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exercise-videos');

-- Allow anyone to upload exercise videos (no auth for now)
CREATE POLICY "Anyone can upload exercise videos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'exercise-videos');

-- Allow anyone to delete exercise videos they uploaded
CREATE POLICY "Anyone can delete exercise videos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'exercise-videos');
