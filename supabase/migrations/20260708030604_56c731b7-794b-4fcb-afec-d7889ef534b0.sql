
-- 1. Chat-files storage policies: enforce ownership + channel/DM membership
DROP POLICY IF EXISTS "Authenticated users read chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload chat files" ON storage.objects;

CREATE POLICY "Users upload own chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Members read authorized chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.image_url LIKE '%/chat-files/' || storage.objects.name
        AND (
          (m.channel_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_channel_members cm
            WHERE cm.channel_id = m.channel_id AND cm.user_id = auth.uid()
          ))
          OR (m.dm_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.chat_dms d
            WHERE d.id = m.dm_id AND (d.user_a = auth.uid() OR d.user_b = auth.uid())
          ))
        )
    )
  )
);

-- 2. brotherhood_connections: only recipient may accept/modify; either party may cancel/decline via delete
DROP POLICY IF EXISTS "Users update own connections" ON public.brotherhood_connections;

CREATE POLICY "Recipient updates connection status"
ON public.brotherhood_connections FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
