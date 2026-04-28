-- Migration: Enforce Simulation Tier Entitlement
-- Description: Adds a database-level trigger to prevent users from inserting simulations with models they do not have access to.

CREATE OR REPLACE FUNCTION public.check_simulation_tier_entitlement()
RETURNS TRIGGER AS $$
DECLARE
  v_user_tier text;
  v_model_type text;
BEGIN
  -- Get user tier
  SELECT tier INTO v_user_tier FROM public.user_profiles WHERE id = NEW.user_id;
  
  -- Extract model type from params
  v_model_type := NEW.params->>'model_type';
  IF v_model_type IS NULL THEN
    v_model_type := NEW.params->>'model';
  END IF;

  -- Apply gating logic
  -- Assuming 'pro' tier models
  IF v_model_type IN ('jump_diffusion', 'fat_tails', 'regime_switching', 'random_forest_regressor', 'lstm_forecast', 'mirofish') AND v_user_tier != 'pro' THEN
    RAISE EXCEPTION 'Tier restriction: % models require Pro tier.', v_model_type;
  END IF;

  -- Path limitations based on tier
  IF v_user_tier = 'free' AND NEW.num_paths > 2000 THEN
    RAISE EXCEPTION 'Tier restriction: Free tier is limited to 2000 paths.';
  ELSIF v_user_tier IN ('plus', 'student') AND NEW.num_paths > 10000 THEN
    RAISE EXCEPTION 'Tier restriction: Plus/Student tier is limited to 10000 paths.';
  ELSIF NEW.num_paths > 100000 THEN
    RAISE EXCEPTION 'System restriction: Max simulation paths is 100000.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_simulation_tier_entitlement ON public.simulations;

CREATE TRIGGER enforce_simulation_tier_entitlement
  BEFORE INSERT ON public.simulations
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_simulation_tier_entitlement();
