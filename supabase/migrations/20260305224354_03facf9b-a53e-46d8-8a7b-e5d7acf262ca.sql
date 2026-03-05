CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, first_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  -- Grant 60-day free trial access (new users only going forward)
  INSERT INTO public.entitlements (user_id, entitlement_type, active, source, expires_at)
  VALUES (NEW.id, 'course_app_access', true, 'manual', now() + interval '60 days')
  ON CONFLICT (user_id, entitlement_type) DO NOTHING;
  -- Auto-enroll in curriculum at signup time
  INSERT INTO public.user_enrollments (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$