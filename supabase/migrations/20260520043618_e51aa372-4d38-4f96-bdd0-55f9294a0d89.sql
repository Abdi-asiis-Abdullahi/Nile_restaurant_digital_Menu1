CREATE TABLE IF NOT EXISTS public.admin_password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_password_reset_otps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_password_reset_otps_email_created
  ON public.admin_password_reset_otps (lower(email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_password_reset_otps_expires
  ON public.admin_password_reset_otps (expires_at);

CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_password_reset_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_password_reset_otps
  WHERE expires_at < now() - interval '1 hour'
     OR consumed_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_admin_password_reset_otps_on_insert ON public.admin_password_reset_otps;
CREATE TRIGGER cleanup_admin_password_reset_otps_on_insert
AFTER INSERT ON public.admin_password_reset_otps
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_admin_password_reset_otps();