
DROP POLICY IF EXISTS "Admin reads all memberships" ON public.chat_channel_members;
CREATE POLICY "Admin reads all memberships" ON public.chat_channel_members
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
