
-- Update handle_new_user to grant permanent free access (no expiry)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
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
  -- Grant permanent free access
  INSERT INTO public.entitlements (user_id, entitlement_type, active, source, expires_at)
  VALUES (NEW.id, 'course_app_access', true, 'manual', NULL)
  ON CONFLICT (user_id, entitlement_type) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Revert has_active_entitlement to ignore expires_at
CREATE OR REPLACE FUNCTION public.has_active_entitlement(_user_id uuid, _type text DEFAULT 'course_app_access'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = _user_id
      AND entitlement_type = _type
      AND active = true
  )
$$;
