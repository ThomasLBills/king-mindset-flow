-- Add spirit_response text column to daily_check_ins for breakthrough moment logging
ALTER TABLE public.daily_check_ins ADD COLUMN spirit_response text;