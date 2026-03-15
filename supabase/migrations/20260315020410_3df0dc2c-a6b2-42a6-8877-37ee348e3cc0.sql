CREATE OR REPLACE FUNCTION public.get_community_armor_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH week_bounds AS (
    SELECT
      (date_trunc('week', now() AT TIME ZONE 'America/Chicago')) AT TIME ZONE 'America/Chicago' AS this_week_start,
      (date_trunc('week', (now() AT TIME ZONE 'America/Chicago') - interval '7 days')) AT TIME ZONE 'America/Chicago' AS last_week_start
  ),
  this_week AS (
    SELECT
      count(*) AS total,
      count(DISTINCT user_id) AS engaged_users
    FROM evidence_events, week_bounds
    WHERE event_type IN ('check_in', 'urge_redirected', 'grace_protocol_complete', 'declaration', 'gratitude')
      AND created_at >= week_bounds.this_week_start
      AND created_at < week_bounds.this_week_start + interval '7 days'
  ),
  last_week AS (
    SELECT count(*) AS total
    FROM evidence_events, week_bounds
    WHERE event_type IN ('check_in', 'urge_redirected', 'grace_protocol_complete', 'declaration', 'gratitude')
      AND created_at >= week_bounds.last_week_start
      AND created_at < week_bounds.this_week_start
  ),
  total_users AS (
    SELECT count(*) AS total FROM profiles
  )
  SELECT json_build_object(
    'this_week_count', (SELECT total FROM this_week),
    'last_week_count', (SELECT total FROM last_week),
    'engaged_users', (SELECT engaged_users FROM this_week),
    'total_users', (SELECT total FROM total_users)
  )
$$;