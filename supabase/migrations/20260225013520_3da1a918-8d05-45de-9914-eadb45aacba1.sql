
-- Table to store 6-digit verification codes for new user account setup
CREATE TABLE public.verification_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  used boolean NOT NULL DEFAULT false
);

-- Index for fast lookup by email + code
CREATE INDEX idx_verification_codes_email_code ON public.verification_codes (email, code);

-- Index for cleanup of expired codes
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes (expires_at);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- No direct client access — all operations go through edge functions with service role
-- No RLS policies needed (service role bypasses RLS)
