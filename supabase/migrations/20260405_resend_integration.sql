-- QuantMind Migration: Resend Integration
-- Configures Custom Auth Hook for Emails and Database Webhook for Welcome Messages

-- 0. Ensure required extension is active (should be already based on pg_net check)
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Create a function to call our auth-hook-email Edge Function
CREATE OR REPLACE FUNCTION public.handle_auth_email_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_id text;
BEGIN
  -- Call the Edge Function via pg_net (async)
  -- Note: Supabase Auth Hooks expect a synchronous response if registered as a HOOK.
  -- To override the email, we use the specific hook registration.
  
  -- However, the recommended way for 'send_email' hook is to register the URL directly 
  -- in the Supabase Dashboard, but for code-only setup, we can use this bridge.
  
  SELECT net.http_post(
    url := 'https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/auth-hook-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('vault.anon_key', true)
    ),
    body := event
  ) INTO response_id;

  RETURN jsonb_build_object('status', 'hook_dispatched', 'id', response_id);
END;
$$;

-- 2. Create the Database Webhook (Trigger) for Welcome Email
-- This sends the email AFTER confirmation (email_confirmed_at transitions from NULL to value)

CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Trigger for UPDATE (Confirmation)
  IF (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    PERFORM net.http_post(
      url := 'https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('vault.anon_key', true)
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;

  -- Trigger for INSERT (OAuth)
  IF (TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL) THEN
    PERFORM net.http_post(
      url := 'https://qvqczzyghhgzaesiwtkj.supabase.co/functions/v1/welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('vault.anon_key', true)
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', row_to_json(NEW),
        'old_record', NULL
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Register the Welcome Email Trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();

-- 4. Note on Auth Hook Registration:
-- To fully activate the 'send_email' hook, you MUST go to the Supabase Dashboard:
-- Authentication -> Hooks -> Send Email
-- And select the 'auth-hook-email' edge function.
-- This part currently cannot be fully automated via SQL on all project tiers without underlying config access.
