
-- Revoke execute from anon/public on has_role; keep it available to authenticated + service_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- Re-scope all policies currently applied to role "public" that call has_role, to "authenticated"
ALTER POLICY "Admins read audit log" ON public.admin_audit_log TO authenticated;
ALTER POLICY "Admins insert audit log" ON public.admin_audit_log TO authenticated;
ALTER POLICY "Admins manage announcements" ON public.announcements TO authenticated;
ALTER POLICY "Admins manage settings" ON public.app_settings TO authenticated;
ALTER POLICY "Admin reads all connections" ON public.brotherhood_connections TO authenticated;
ALTER POLICY "Admin reads all memberships" ON public.chat_channel_members TO authenticated;
ALTER POLICY "Admin inserts memberships" ON public.chat_channel_members TO authenticated;
ALTER POLICY "Admins manage channels" ON public.chat_channels TO authenticated;
ALTER POLICY "Admin deletes any message" ON public.chat_messages TO authenticated;
ALTER POLICY "Admin reads all messages" ON public.chat_messages TO authenticated;
ALTER POLICY "Admins read all course progress" ON public.course_progress TO authenticated;
ALTER POLICY "Admins manage courses" ON public.courses TO authenticated;
ALTER POLICY "Admins read all curriculum progress" ON public.curriculum_lesson_progress TO authenticated;
ALTER POLICY "Admins manage curriculum_lessons" ON public.curriculum_lessons TO authenticated;
ALTER POLICY "Admins manage curriculum_settings" ON public.curriculum_settings TO authenticated;
ALTER POLICY "Admins manage versions" ON public.curriculum_versions TO authenticated;
ALTER POLICY "Admins read all check-ins" ON public.daily_check_ins TO authenticated;
ALTER POLICY "Admins read all completions" ON public.daily_completions TO authenticated;
ALTER POLICY "Admin reads all entitlements" ON public.entitlements TO authenticated;
ALTER POLICY "Admins read all evidence" ON public.evidence_events TO authenticated;
ALTER POLICY "Admins read all streaks" ON public.freedom_streaks TO authenticated;
ALTER POLICY "Admins read all gratitude" ON public.gratitude_entries TO authenticated;
ALTER POLICY "Admins read all lesson progress" ON public.lesson_progress TO authenticated;
ALTER POLICY "Admins manage lesson resources" ON public.lesson_resources TO authenticated;
ALTER POLICY "Admins manage lessons" ON public.lessons TO authenticated;
ALTER POLICY "Admins manage modules" ON public.modules TO authenticated;
ALTER POLICY "Admin reads all profiles" ON public.profiles TO authenticated;
ALTER POLICY "Admins manage programs" ON public.programs TO authenticated;
ALTER POLICY "Admin reads all subscriptions" ON public.subscriptions TO authenticated;
ALTER POLICY "Admins read all enrollments" ON public.user_enrollments TO authenticated;
ALTER POLICY "Admins manage weeks" ON public.weeks TO authenticated;
ALTER POLICY "Admins read all yield logs" ON public.yield_logs TO authenticated;
