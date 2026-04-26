DELETE FROM public.daily_check_ins
WHERE user_id = 'ede6c356-7c74-4658-a22c-14f3a901730a'
  AND check_in_date IN ('2026-04-25','2026-04-26');

DELETE FROM public.evidence_events
WHERE user_id = 'ede6c356-7c74-4658-a22c-14f3a901730a'
  AND event_type = 'check_in'
  AND created_at > now() - interval '48 hours';