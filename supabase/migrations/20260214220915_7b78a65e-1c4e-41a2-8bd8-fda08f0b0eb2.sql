
-- Chat message reactions table
CREATE TABLE public.chat_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read reactions on visible messages" ON public.chat_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users add reactions" ON public.chat_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own reactions" ON public.chat_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Add image_url column to chat_messages for image attachments
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create chat-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone reads chat files" ON storage.objects FOR SELECT USING (bucket_id = 'chat-files');
CREATE POLICY "Authenticated users upload chat files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
