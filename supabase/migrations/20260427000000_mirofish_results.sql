CREATE TABLE IF NOT EXISTS simulation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    portfolio_snapshot JSONB NOT NULL,
    news_seed TEXT NOT NULL,
    interaction_graph JSONB, -- Storing the D3-compatible nodes/edges
    trajectory_data JSONB,    -- Price/Sentiment evolution over 24h
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'portfolios'
        AND column_name = 'last_sim_id'
    ) THEN
        ALTER TABLE portfolios ADD COLUMN last_sim_id UUID REFERENCES simulation_runs(id);
    END IF;
END $$;
