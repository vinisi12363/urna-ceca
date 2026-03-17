-- 1. Create the bucket (safe to run again)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Public_images', 'Public_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow PUBLIC access to read/download images from "Public_images"
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'Public_images' );

-- 3. Allow AUTHENTICATED users to upload/insert to "Public_images"
CREATE POLICY "Auth Insert"
ON storage.objects FOR INSERT
TO authenticated 
WITH CHECK ( bucket_id = 'Public_images' );

-- 4. Allow AUTHENTICATED users to update their files (optional)
CREATE POLICY "Auth Update"
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'Public_images' );

-- 5. Allow AUTHENTICATED users to delete their files (optional)
CREATE POLICY "Auth Delete"
ON storage.objects FOR DELETE
TO authenticated 
USING ( bucket_id = 'Public_images' );
