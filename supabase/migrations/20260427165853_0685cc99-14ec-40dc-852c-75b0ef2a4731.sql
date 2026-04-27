
-- Enable extensions needed for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper function that deactivates expired entitlements
CREATE OR REPLACE FUNCTION public.deactivate_expired_entitlements()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count integer;
BEGIN
  UPDATE public.entitlements
  SET active = false,
      updated_at = now()
  WHERE active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;
