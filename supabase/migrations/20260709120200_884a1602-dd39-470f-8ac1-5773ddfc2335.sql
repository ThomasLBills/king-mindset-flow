-- Forge redesign: "raise the banner" prayer requests + "send strength" responses.
-- The banner row is what brothers see on Today; the actual outreach message is
-- composed over existing chat DMs client-side.

CREATE TABLE public.prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prayer_requests_user_sent_idx ON public.prayer_requests (user_id, sent_at DESC);

CREATE TABLE public.prayer_request_strength (
  request_id uuid NOT NULL REFERENCES public.prayer_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

-- Brothers = share a group, or have an accepted 1:1 brotherhood connection.
CREATE OR REPLACE FUNCTION public.are_brothers(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members ga
    JOIN public.group_members gb ON ga.group_id = gb.group_id
    WHERE ga.user_id = _a AND gb.user_id = _b
  )
  OR EXISTS (
    SELECT 1 FROM public.brotherhood_connections
    WHERE status = 'accepted'
      AND ((requester_id = _a AND recipient_id = _b)
        OR (requester_id = _b AND recipient_id = _a))
  );
$$;

REVOKE ALL ON FUNCTION public.are_brothers(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_brothers(uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_request_strength ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester and brothers read prayer requests"
  ON public.prayer_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.are_brothers(auth.uid(), user_id));

CREATE POLICY "Users raise own banner"
  ON public.prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Visible-request parties read strength"
  ON public.prayer_request_strength FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prayer_requests pr
      WHERE pr.id = request_id
        AND (pr.user_id = auth.uid() OR public.are_brothers(auth.uid(), pr.user_id))
    )
  );

CREATE POLICY "Brothers send own strength"
  ON public.prayer_request_strength FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.prayer_requests pr
      WHERE pr.id = request_id AND public.are_brothers(auth.uid(), pr.user_id)
    )
  );
