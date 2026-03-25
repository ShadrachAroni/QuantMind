-- Migration 111: Seed Assets and Demo Portfolio
-- Provides initial data for simulations to function correctly.

-- 1. Seed Assets Table
INSERT INTO public.assets (ticker, name, category, provider, min_tier)
VALUES 
  ('AAPL', 'Apple Inc.', 'equity', 'yahoo', 'free'),
  ('MSFT', 'Microsoft Corp.', 'equity', 'yahoo', 'free'),
  ('TSLA', 'Tesla, Inc.', 'equity', 'yahoo', 'free'),
  ('AMZN', 'Amazon.com, Inc.', 'equity', 'yahoo', 'free'),
  ('NVDA', 'NVIDIA Corp.', 'equity', 'yahoo', 'free'),
  ('BTC/USD', 'Bitcoin', 'crypto', 'finnhub', 'free'),
  ('ETH/USD', 'Ethereum', 'crypto', 'finnhub', 'free'),
  ('SOL/USD', 'Solana', 'crypto', 'finnhub', 'free'),
  ('SPX', 'S&P 500 Index', 'index', 'yahoo', 'free')
ON CONFLICT (ticker) DO NOTHING;

-- 2. Create/Update Demo Portfolio
-- Assuming we want to ensure at least one portfolio exists for the demo
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.portfolios (id, user_id, name, description, assets, total_value, is_active)
        VALUES (
            'd0000000-0000-0000-0000-000000000001',
            v_user_id,
            'Institutional_Growth_Vault',
            'Primary algorithmic strategy for high-alpha tech and crypto allocations.',
            '[
                {"ticker": "AAPL", "weight": 0.2, "name": "Apple Inc."},
                {"ticker": "MSFT", "weight": 0.2, "name": "Microsoft Corp."},
                {"ticker": "BTC/USD", "weight": 0.3, "name": "Bitcoin"},
                {"ticker": "NVDA", "weight": 0.3, "name": "NVIDIA Corp."}
            ]'::jsonb,
            100000,
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            assets = EXCLUDED.assets,
            name = EXCLUDED.name;
    END IF;
END $$;
