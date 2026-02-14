
-- Fix chat_channel_members: drop the recursive policy and replace with a simple one
DROP POLICY IF EXISTS "Members read co-members" ON public.chat_channel_members;
DROP POLICY IF EXISTS "Users read own memberships" ON public.chat_channel_members;
DROP POLICY IF EXISTS "Admin reads all memberships" ON public.chat_channel_members;
DROP POLICY IF EXISTS "Authenticated users join public channels" ON public.chat_channel_members;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users read own memberships"
  ON public.chat_channel_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin reads all memberships"
  ON public.chat_channel_members FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users join public channels"
  ON public.chat_channel_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM chat_channels
      WHERE chat_channels.id = chat_channel_members.channel_id
        AND chat_channels.type = 'public'
    )
  );

-- Fix profiles: ensure permissive policies
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin reads all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Fix chat_channels: ensure permissive
DROP POLICY IF EXISTS "Authenticated users read public channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Admins update channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Admins delete channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Authenticated users create channels" ON public.chat_channels;
DROP POLICY IF EXISTS "Members read private channels" ON public.chat_channels;

CREATE POLICY "Authenticated users read public channels"
  ON public.chat_channels FOR SELECT
  USING (type = 'public');

CREATE POLICY "Admins manage channels"
  ON public.chat_channels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users create channels"
  ON public.chat_channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Fix entitlements & subscriptions for admin visibility
DROP POLICY IF EXISTS "Users read own entitlements" ON public.entitlements;
DROP POLICY IF EXISTS "Admin reads all entitlements" ON public.entitlements;

CREATE POLICY "Users read own entitlements"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all entitlements"
  ON public.entitlements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin reads all subscriptions" ON public.subscriptions;

CREATE POLICY "Users read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin reads all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin insert for channel members (for channel creation flow)
CREATE POLICY "Admin inserts memberships"
  ON public.chat_channel_members FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
