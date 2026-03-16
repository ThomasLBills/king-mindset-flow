INSERT INTO public.user_enrollments (user_id, enrolled_at)
SELECT p.user_id, p.created_at
FROM profiles p
LEFT JOIN user_enrollments ue ON ue.user_id = p.user_id
WHERE ue.id IS NULL
ON CONFLICT DO NOTHING;