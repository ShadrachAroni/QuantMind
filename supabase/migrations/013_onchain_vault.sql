-- QuantMind Migration 013 — On-Chain Vault & Market Analytics
-- Supporting Pro-tier features for multi-chain wallet tracking and blockchain metrics.

-- ======================================================
-- USER_WALLETS
-- ======================================================
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address         TEXT          NOT NULL,
  network         TEXT          NOT NULL CHECK (network IN ('ethereum', 'binance_smart_chain', 'solana')),
  alias           TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  metadata        JSONB,        -- Store last known balance, ENS name, etc.
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  -- Prevent duplicate addresses for the same user on the same network
  UNIQUE(user_id, address, network)
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wallets"
  ON public.user_wallets FOR ALL
  USING (auth.uid() = user_id);

-- ======================================================
-- USER_NEWS_PREFERENCES
-- ======================================================
CREATE TABLE IF NOT EXISTS public.user_news_preferences (
  user_id         UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  categories      TEXT[]        NOT NULL DEFAULT '{crypto, blockchain, defi}',
  sources         TEXT[]        NOT NULL DEFAULT '{binance, coindesk, cointelegraph}',
  last_fetched_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.user_news_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own news preferences"
  ON public.user_news_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ======================================================
-- TRADING_TERMINAL_CONFIGS
-- ======================================================
-- Store layouts and indicators for the Binance-level market terminal
CREATE TABLE IF NOT EXISTS public.trading_terminal_configs (
  user_id         UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_layout   JSONB         NOT NULL DEFAULT '{"symbol": "BTCUSDT", "indicators": ["EMA", "RSI"], "timeframe": "1h"}',
  favorite_pairs  TEXT[]        NOT NULL DEFAULT '{BTCUSDT, ETHUSDT, SOLUSDT}',
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.trading_terminal_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own terminal configs"
  ON public.trading_terminal_configs FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER user_news_preferences_updated_at BEFORE UPDATE ON public.user_news_preferences FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER trading_terminal_configs_updated_at BEFORE UPDATE ON public.trading_terminal_configs FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
