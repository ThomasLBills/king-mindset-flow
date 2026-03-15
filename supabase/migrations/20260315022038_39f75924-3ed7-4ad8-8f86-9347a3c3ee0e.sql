
CREATE OR REPLACE FUNCTION public.get_evidence_counts_by_user()
RETURNS TABLE(user_id uuid, evidence_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, count(*) AS evidence_count
  FROM evidence_events
  GROUP BY user_id
$$;
