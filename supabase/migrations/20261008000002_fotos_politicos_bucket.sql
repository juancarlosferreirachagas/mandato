-- Migration: Creates a public bucket for politicians' photos

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos_politicos', 'fotos_politicos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create policies for the bucket objects
-- Allow public read access to anyone
CREATE POLICY "Public Read Access for Fotos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fotos_politicos');

-- Allow authenticated users (staff/service_role) to insert/update/delete
CREATE POLICY "Auth Insert Access for Fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos_politicos');

CREATE POLICY "Auth Update Access for Fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fotos_politicos');

CREATE POLICY "Auth Delete Access for Fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fotos_politicos');
