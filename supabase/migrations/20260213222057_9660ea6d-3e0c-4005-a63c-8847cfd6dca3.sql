
-- =============================================
-- 1. Brotherhood Connections table
-- =============================================
CREATE TABLE public.brotherhood_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, recipient_id)
);

ALTER TABLE public.brotherhood_connections ENABLE ROW LEVEL SECURITY;

-- Users can read connections they're part of
CREATE POLICY "Users read own connections"
  ON public.brotherhood_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can create connection requests
CREATE POLICY "Users create connection requests"
  ON public.brotherhood_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND requester_id <> recipient_id);

-- Users can update connections they're part of (accept/decline/close)
CREATE POLICY "Users update own connections"
  ON public.brotherhood_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can delete (close) connections they're part of
CREATE POLICY "Users delete own connections"
  ON public.brotherhood_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Admin reads all
CREATE POLICY "Admin reads all connections"
  ON public.brotherhood_connections FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_brotherhood_connections_updated_at
  BEFORE UPDATE ON public.brotherhood_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 2. Channel admin fields
-- =============================================
ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Allow admins to update channels
CREATE POLICY "Admins update channels"
  ON public.chat_channels FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete channels
CREATE POLICY "Admins delete channels"
  ON public.chat_channels FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- =============================================
-- 3. App settings table for max brothers limit
-- =============================================
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone reads settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins manage settings"
  ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Seed default max brothers
INSERT INTO public.app_settings (key, value)
VALUES ('max_brothers', '5'::jsonb);

-- =============================================
-- 4. Update existing seed channels with admin fields
-- =============================================
UPDATE public.chat_channels SET is_default = true, is_pinned = true, sort_order = 1 WHERE name = 'general';
UPDATE public.chat_channels SET is_default = true, sort_order = 2 WHERE name = 'wins';
UPDATE public.chat_channels SET is_default = true, sort_order = 3 WHERE name = 'prayer';
UPDATE public.chat_channels SET is_default = true, sort_order = 4 WHERE name = 'accountability';

-- =============================================
-- 5. Restrict DMs to brothers only via RLS update
-- We need to update chat_dms INSERT policy
-- =============================================
DROP POLICY IF EXISTS "Users create DMs" ON public.chat_dms;

CREATE POLICY "Users create DMs with brothers"
  ON public.chat_dms FOR INSERT
  WITH CHECK (
    (auth.uid() = user_a OR auth.uid() = user_b)
    AND EXISTS (
      SELECT 1 FROM public.brotherhood_connections
      WHERE status = 'accepted'
        AND (
          (requester_id = user_a AND recipient_id = user_b)
          OR (requester_id = user_b AND recipient_id = user_a)
        )
    )
  );

-- Enable realtime for brotherhood_connections
ALTER PUBLICATION supabase_realtime ADD TABLE public.brotherhood_connections;
