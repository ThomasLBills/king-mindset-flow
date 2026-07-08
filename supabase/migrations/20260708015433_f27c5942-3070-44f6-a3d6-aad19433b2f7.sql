-- Task 4: curriculum-files private + rate-limit table

-- 1) Storage RLS: drop public read, add authenticated-only read (edge fn uses service_role)
DROP POLICY IF EXISTS "Anyone reads curriculum files" ON storage.objects;

CREATE POLICY "Authenticated reads curriculum files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'curriculum-files'
    AND (
      has_role(auth.uid(), 'admin')
      OR public.has_active_entitlement(auth.uid(), 'course_app_access')
    )
  );

-- 2) Ad-hoc per-user rate limiter (fixed-window buckets)
CREATE TABLE public.edge_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bucket_key, window_start)
);

GRANT ALL ON public.edge_rate_limits TO service_role;

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

-- No authenticated policies: only edge functions using service_role touch this table.

CREATE INDEX edge_rate_limits_cleanup_idx
  ON public.edge_rate_limits (window_start);

CREATE TRIGGER edge_rate_limits_updated_at
  BEFORE UPDATE ON public.edge_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3) Atomic increment helper (bumps counter, returns new count)
CREATE OR REPLACE FUNCTION public.bump_rate_limit(
  _user_id uuid,
  _bucket_key text,
  _window_start timestamptz
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.edge_rate_limits (user_id, bucket_key, window_start, count)
  VALUES (_user_id, _bucket_key, _window_start, 1)
  ON CONFLICT (user_id, bucket_key, window_start)
  DO UPDATE SET count = public.edge_rate_limits.count + 1,
                updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(uuid, text, timestamptz) TO service_role;