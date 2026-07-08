CREATE POLICY "Owners can update their chat files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-files' AND owner = auth.uid())
WITH CHECK (bucket_id = 'chat-files' AND owner = auth.uid());

CREATE POLICY "Owners can delete their chat files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-files' AND owner = auth.uid());

CREATE POLICY "Admins can update any chat file"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-files' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'chat-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any chat file"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-files' AND public.has_role(auth.uid(), 'admin'::app_role));