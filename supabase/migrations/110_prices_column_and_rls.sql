-- Migration 110: Add change_24h to prices and allow public read
-- This resolves the "Establishing Institutional Data Link" issue in the TickerTape component.

-- 1. Add change_24h column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prices' AND column_name='change_24h') THEN
        ALTER TABLE public.prices ADD COLUMN change_24h numeric(18,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Add RLS policy for public (anon) read access
-- The existing policy only allows 'authenticated' users.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public read prices') THEN
        CREATE POLICY "public read prices" ON public.prices
        FOR SELECT TO anon USING (true);
    END IF;
END $$;
