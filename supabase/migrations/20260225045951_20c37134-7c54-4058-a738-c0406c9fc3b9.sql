
-- Add temp_password column to profiles to persist the generated password
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_password text;
