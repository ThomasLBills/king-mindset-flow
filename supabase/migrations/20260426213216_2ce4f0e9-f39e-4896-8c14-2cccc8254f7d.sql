DELETE FROM public.daily_check_ins
WHERE user_id = 'ede6c356-7c74-4658-a22c-14f3a901730a'
  AND check_in_date = CURRENT_DATE;

DELETE FROM public.evidence_events
WHERE user_id = 'ede6c356-7c74-4658-a22c-14f3a901730a'
  AND event_type = 'check_in'
  AND created_at >= (CURRENT_DATE AT TIME ZONE 'UTC')
  AND created_at < ((CURRENT_DATE + 1) AT TIME ZONE 'UTC');