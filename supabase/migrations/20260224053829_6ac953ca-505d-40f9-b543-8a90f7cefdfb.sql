
-- 1. Make chat-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-files';

-- 2. Drop the overly permissive public read policy on chat-files
DROP POLICY IF EXISTS "Anyone reads chat files" ON storage.objects;

-- 3. Add proper RLS: users can only read chat files from channels/DMs they belong to
CREATE POLICY "Users read accessible chat files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-files' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      WHERE cm.image_url LIKE '%' || storage.objects.name
      AND (
        (cm.channel_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.chat_channel_members ccm
          WHERE ccm.channel_id = cm.channel_id AND ccm.user_id = auth.uid()
        ))
        OR
        (cm.dm_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.chat_dms cd
          WHERE cd.id = cm.dm_id AND (cd.user_a = auth.uid() OR cd.user_b = auth.uid())
        ))
      )
    )
  );

-- 4. Fix chat_reactions RLS - restrict reads to messages the user can access
DROP POLICY IF EXISTS "Users read reactions on visible messages" ON public.chat_reactions;

CREATE POLICY "Users read reactions on accessible messages" ON public.chat_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages cm
      WHERE cm.id = chat_reactions.message_id
      AND (
        (cm.channel_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.chat_channel_members ccm
          WHERE ccm.channel_id = cm.channel_id AND ccm.user_id = auth.uid()
        ))
        OR
        (cm.dm_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.chat_dms cd
          WHERE cd.id = cm.dm_id AND (cd.user_a = auth.uid() OR cd.user_b = auth.uid())
        ))
      )
    )
  );
