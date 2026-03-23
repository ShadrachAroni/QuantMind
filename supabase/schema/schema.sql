-- QuantMind Consolidated Application Schema
-- Version: 1.0.4_STABLE
-- Generated: 2026-03-23

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================================
-- USER_PROFILES
-- ======================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT          NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  tier            TEXT          NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'pro', 'student')),
  onboarding_completed BOOLEAN   NOT NULL DEFAULT false,
  date_of_birth   DATE,
  analytics_consent BOOLEAN     NOT NULL DEFAULT true,
  mfa_enabled     BOOLEAN       NOT NULL DEFAULT false,
  is_student_verified BOOLEAN   NOT NULL DEFAULT false,
  student_verification_id TEXT,
  student_verified_at TIMESTAMPTZ,
  has_used_trial  BOOLEAN       DEFAULT false,
  trial_ends_at   TIMESTAMPTZ,
  password_last_changed_at TIMESTAMPTZ DEFAULT now(),
  password_expiry_notified_at TIMESTAMPTZ,
  is_admin        BOOLEAN       DEFAULT false,
  ai_model        TEXT          DEFAULT 'haiku' CHECK (ai_model IN ('haiku', 'sonnet', 'opus')),
  ai_expertise    TEXT          DEFAULT 'intermediate' CHECK (ai_expertise IN ('beginner', 'intermediate', 'advanced')),
  ai_portfolio_doctor BOOLEAN   DEFAULT true,
  ai_voice_synthesis BOOLEAN    DEFAULT false,
  ai_risk_alerts  BOOLEAN       DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- ======================================================
-- USER_AI_CONFIGS (Personal Key Vault)
-- ======================================================
CREATE TABLE IF NOT EXISTS public.user_ai_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google', 'custom')),
    model_id        TEXT NOT NULL,
    encrypted_api_key TEXT,
    is_active       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_ai_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own AI configs" 
ON public.user_ai_configs FOR ALL 
USING (auth.uid() = user_id);

-- ======================================================
-- APP_CHANGELOG
-- ======================================================
CREATE TABLE IF NOT EXISTS public.app_changelog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version         TEXT NOT NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'backend', 'all')),
    category        TEXT NOT NULL CHECK (category IN ('feature', 'fix', 'performance', 'security', 'maintenance')),
    title           TEXT NOT NULL,
    description     TEXT,
    impact_level    TEXT NOT NULL DEFAULT 'low' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    user_groups     TEXT[] DEFAULT '{all}'::TEXT[],
    is_breaking     BOOLEAN DEFAULT false,
    environment     TEXT DEFAULT 'production' CHECK (environment IN ('development', 'testing', 'staging', 'production')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to production changelogs" 
ON public.app_changelog FOR SELECT 
TO public 
USING (environment = 'production');

-- ======================================================
-- SUBSCRIPTIONS
-- ======================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier            TEXT          NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'pro', 'student')),
  status          TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  revenuecat_id   TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_ends_at   TIMESTAMPTZ,
  last_expiry_notified_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ======================================================
-- FUNCTIONS & TRIGGERS
-- ======================================================

-- AI Encryption RPCs
CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_text TEXT, passphrase TEXT)
RETURNS TEXT AS $$
    SELECT pgp_sym_encrypt(plain_text, passphrase)::TEXT;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_text TEXT)
RETURNS TEXT AS $$
DECLARE
    passphrase TEXT;
BEGIN
    passphrase := current_setting('app.settings.encryption_key', true);
    IF passphrase IS NULL OR passphrase = '' THEN
        passphrase := 'development_fallback_key';
    END IF;
    RETURN pgp_sym_decrypt(encrypted_text::BYTEA, passphrase);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Save Config Logic
CREATE OR REPLACE FUNCTION public.save_user_ai_config(p_provider TEXT, p_model_id TEXT, p_api_key TEXT)
RETURNS UUID AS $$
DECLARE
    v_config_id UUID;
    v_passphrase TEXT;
BEGIN
    v_passphrase := current_setting('app.settings.encryption_key', true);
    IF v_passphrase IS NULL OR v_passphrase = '' THEN
        v_passphrase := 'development_fallback_key';
    END IF;

    -- Deactivate others for same provider
    UPDATE public.user_ai_configs 
    SET is_active = false 
    WHERE user_id = auth.uid() AND provider = p_provider;

    INSERT INTO public.user_ai_configs (user_id, provider, model_id, encrypted_api_key, is_active)
    VALUES (auth.uid(), p_provider, p_model_id, pg_sym_encrypt(p_api_key, v_passphrase), true)
    RETURNING id INTO v_config_id;

    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER user_ai_configs_updated_at BEFORE UPDATE ON public.user_ai_configs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER app_changelog_updated_at BEFORE UPDATE ON public.app_changelog FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
