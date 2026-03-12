-- Drop the existing permissive INSERT policy
DROP POLICY "Users send messages" ON public.chat_messages;

-- Create a new INSERT policy that:
-- 1. Ensures user_id matches auth.uid()
-- 2. For channel messages: requires membership AND checks if the channel is locked (only admins can post to locked channels)
-- 3. For DM messages: requires the user to be part of the DM
CREATE POLICY "Users send messages" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    (
      channel_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM chat_channel_members
        WHERE chat_channel_members.channel_id = chat_messages.channel_id
        AND chat_channel_members.user_id = auth.uid()
      )
      AND (
        NOT EXISTS (
          SELECT 1 FROM chat_channels
          WHERE chat_channels.id = chat_messages.channel_id
          AND chat_channels.is_locked = true
        )
        OR has_role(auth.uid(), 'admin')
      )
    )
    OR (
      dm_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM chat_dms
        WHERE chat_dms.id = chat_messages.dm_id
        AND (chat_dms.user_a = auth.uid() OR chat_dms.user_b = auth.uid())
      )
    )
  )
);