
-- Allow admins to delete any chat message
CREATE POLICY "Admin deletes any message"
ON public.chat_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
