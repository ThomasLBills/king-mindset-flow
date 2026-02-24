
-- Add expires_at column to entitlements
ALTER TABLE public.entitlements
ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;

-- Update has_active_entitlement function to check expiration
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
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Update handle_new_user to auto-grant 60-day free trial entitlement
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
  -- Grant 60-day free trial
  INSERT INTO public.entitlements (user_id, entitlement_type, active, source, expires_at)
  VALUES (NEW.id, 'course_app_access', true, 'free_trial', NEW.created_at + interval '60 days')
  ON CONFLICT (user_id, entitlement_type) DO NOTHING;
  RETURN NEW;
END;
$$;
