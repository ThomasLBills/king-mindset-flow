
-- Update handle_new_user to grant 60-day trial (not permanent) for NEW users going forward
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
  RETURN NEW;
END;
$function$;

-- Update has_active_entitlement to respect expires_at
CREATE OR REPLACE FUNCTION public.has_active_entitlement(_user_id uuid, _type text DEFAULT 'course_app_access'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = _user_id
      AND entitlement_type = _type
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$function$;
