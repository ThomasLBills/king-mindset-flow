
-- Track when a user last read each channel or DM
CREATE TABLE public.chat_read_cursors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  channel_id uuid REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  dm_id uuid REFERENCES public.chat_dms(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT one_target CHECK (
    (channel_id IS NOT NULL AND dm_id IS NULL) OR
    (channel_id IS NULL AND dm_id IS NOT NULL)
  ),
  UNIQUE(user_id, channel_id),
  UNIQUE(user_id, dm_id)
);

ALTER TABLE public.chat_read_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own cursors"
ON public.chat_read_cursors FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own cursors"
ON public.chat_read_cursors FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own cursors"
ON public.chat_read_cursors FOR UPDATE
USING (auth.uid() = user_id);
