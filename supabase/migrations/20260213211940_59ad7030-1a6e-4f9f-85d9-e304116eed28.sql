
-- =============================================
-- PHASE 1: Expand profiles + Chat tables + RLS
-- =============================================

-- 1. Expand profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, first_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Trigger for updated_at on profiles
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 2. Create ALL tables first (no policies yet)
-- =============================================

CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

CREATE TABLE public.chat_dms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  dm_id uuid REFERENCES public.chat_dms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (
    (channel_id IS NOT NULL AND dm_id IS NULL) OR
    (channel_id IS NULL AND dm_id IS NOT NULL)
  )
);

CREATE TABLE public.chat_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =============================================
-- 3. Enable RLS on all tables
-- =============================================
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_dms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_flags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. RLS Policies (tables exist now)
-- =============================================

-- chat_channels
CREATE POLICY "Authenticated users read public channels"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (type = 'public');

CREATE POLICY "Members read private channels"
  ON public.chat_channels FOR SELECT TO authenticated
  USING (
    type = 'private' AND EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_channels.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users create channels"
  ON public.chat_channels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- chat_channel_members
CREATE POLICY "Users read own memberships"
  ON public.chat_channel_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Members read co-members"
  ON public.chat_channel_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channel_members AS m
      WHERE m.channel_id = chat_channel_members.channel_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users join public channels"
  ON public.chat_channel_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.chat_channels WHERE id = channel_id AND type = 'public'
    )
  );

-- chat_dms
CREATE POLICY "Users read own DMs"
  ON public.chat_dms FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users create DMs"
  ON public.chat_dms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- chat_messages
CREATE POLICY "Members read channel messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    (channel_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_channel_members
      WHERE channel_id = chat_messages.channel_id AND user_id = auth.uid()
    ))
    OR
    (dm_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.chat_dms
      WHERE id = chat_messages.dm_id AND (user_a = auth.uid() OR user_b = auth.uid())
    ))
  );

CREATE POLICY "Users send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users edit own messages"
  ON public.chat_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- chat_flags
CREATE POLICY "Users create flags"
  ON public.chat_flags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = flagged_by);

CREATE POLICY "Admins read flags"
  ON public.chat_flags FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update flags"
  ON public.chat_flags FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 5. Triggers
-- =============================================
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 6. Realtime
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- =============================================
-- 7. Seed default channels
-- =============================================
INSERT INTO public.chat_channels (name, description, type, created_by)
VALUES
  ('general', 'General discussion', 'public', '00000000-0000-0000-0000-000000000000'),
  ('wins', 'Share your victories', 'public', '00000000-0000-0000-0000-000000000000'),
  ('prayer', 'Prayer requests and support', 'public', '00000000-0000-0000-0000-000000000000'),
  ('accountability', 'Stay accountable together', 'public', '00000000-0000-0000-0000-000000000000');
