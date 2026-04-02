
DROP POLICY IF EXISTS "Users read accessible chat files" ON storage.objects;

CREATE POLICY "Authenticated users read chat files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'chat-files'
  AND auth.uid() IS NOT NULL
);
