
-- Add password_set flag to profiles
ALTER TABLE public.profiles ADD COLUMN password_set boolean NOT NULL DEFAULT false;

-- Set existing users who already have passwords to true
-- (all users created before this migration are assumed to have set passwords)
UPDATE public.profiles SET password_set = true WHERE onboarding_completed = true;
