DROP POLICY IF EXISTS "Users edit own messages" ON public.chat_messages;

CREATE POLICY "Users edit own messages" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (channel_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.chat_channel_members m
        WHERE m.channel_id = chat_messages.channel_id AND m.user_id = auth.uid()
      ))
      OR
      (dm_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.chat_dms d
        WHERE d.id = chat_messages.dm_id AND (d.user_a = auth.uid() OR d.user_b = auth.uid())
      ))
    )
  );