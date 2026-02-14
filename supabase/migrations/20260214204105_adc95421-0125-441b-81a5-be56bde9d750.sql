
CREATE POLICY "Admin reads all messages" ON public.chat_messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
