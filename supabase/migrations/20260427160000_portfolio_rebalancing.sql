-- QuantMind Migration 027 — Portfolio Rebalancing Logic
-- This migration adds functionality to automatically rebalance portfolios based on MiroFish sentiment shocks.

-- 1. Table for Rebalancing Logs
CREATE TABLE IF NOT EXISTS public.portfolio_rebalancing_logs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id    uuid          NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  snapshot_id     uuid          REFERENCES public.simulation_snapshots(id) ON DELETE SET NULL,
  sentiment_shock NUMERIC       NOT NULL,
  previous_assets JSONB         NOT NULL,
  new_assets      JSONB         NOT NULL,
  applied_at      TIMESTAMPTZ   DEFAULT now()
);

ALTER TABLE public.portfolio_rebalancing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rebalancing logs"
  ON public.portfolio_rebalancing_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.portfolios p 
    WHERE p.id = portfolio_id AND p.user_id = auth.uid()
  ));

-- 2. Function to apply rebalancing
-- This is a sophisticated heuristic: it shifts weights based on the sentiment shock.
CREATE OR REPLACE FUNCTION public.apply_sentiment_rebalancing(
  p_portfolio_id uuid,
  p_shock numeric,
  p_snapshot_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_current_assets jsonb;
  v_new_assets jsonb;
  v_asset_record record;
  v_adjustment numeric;
BEGIN
  -- Get current assets
  SELECT assets INTO v_current_assets FROM public.portfolios WHERE id = p_portfolio_id;
  
  IF v_current_assets IS NULL THEN
    RAISE EXCEPTION 'Portfolio not found';
  END IF;

  -- Heuristic: Shift weights by shock magnitude
  -- If shock is > 0 (Positive), we increase 'Growth' assets (like BTC, NVDA)
  -- If shock is < 0 (Negative), we increase 'Defensive' assets (like GOLD, USD)
  
  -- For this demo, we'll just multiply the weights by (1 + shock * correlation)
  -- and then re-normalize to 100%.
  
  WITH adjusted AS (
    SELECT 
      obj->>'symbol' as symbol,
      (obj->>'weight')::numeric * (1 + p_shock * (CASE WHEN (obj->>'symbol') IN ('BTC', 'ETH', 'NVDA', 'TSLA') THEN 1 ELSE -0.5 END)) as new_weight
    FROM jsonb_array_elements(v_current_assets) as obj
  ),
  normalized AS (
    SELECT 
      symbol,
      new_weight / SUM(new_weight) OVER() * 100 as final_weight
    FROM adjusted
  )
  SELECT jsonb_agg(jsonb_build_object('symbol', symbol, 'weight', ROUND(final_weight, 2)))
  INTO v_new_assets
  FROM normalized;

  -- Log the change
  INSERT INTO public.portfolio_rebalancing_logs (
    portfolio_id, 
    snapshot_id, 
    sentiment_shock, 
    previous_assets, 
    new_assets
  ) VALUES (
    p_portfolio_id,
    p_snapshot_id,
    p_shock,
    v_current_assets,
    v_new_assets
  );

  -- Update portfolio
  UPDATE public.portfolios SET assets = v_new_assets, updated_at = now() WHERE id = p_portfolio_id;

  RETURN v_new_assets;
END;
$$;

-- Hardening the new function immediately
ALTER FUNCTION public.apply_sentiment_rebalancing(uuid, numeric, uuid) SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.apply_sentiment_rebalancing(uuid, numeric, uuid) FROM anon, authenticated;
-- Note: It should be called via a secure wrapper or service role for now, 
-- or we can GRANT to authenticated if we add a user_id check inside.

-- Improved version with user check
CREATE OR REPLACE FUNCTION public.rebalance_my_portfolio(
  p_portfolio_id uuid,
  p_shock numeric,
  p_snapshot_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM public.portfolios WHERE id = p_portfolio_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN public.apply_sentiment_rebalancing(p_portfolio_id, p_shock, p_snapshot_id);
END;
$$;

ALTER FUNCTION public.rebalance_my_portfolio(uuid, numeric, uuid) SET search_path = '';
GRANT EXECUTE ON FUNCTION public.rebalance_my_portfolio(uuid, numeric, uuid) TO authenticated;
