-- Task 1: Eliminate plaintext temporary passwords from the database.
-- 1) Overwrite any existing plaintext values so they cannot be read from
--    backups or WAL after the column is dropped.
UPDATE public.profiles SET temp_password = NULL WHERE temp_password IS NOT NULL;

-- 2) Drop the column entirely so no code path can ever write to it again.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS temp_password;