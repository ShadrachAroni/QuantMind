-- Enable Realtime for key synchronization tables
-- Created: 2026-03-26

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulations;

-- Ensure RLS is handled correctly for Realtime (already exists for these tables)
-- Realtime respects RLS policies out of the box.
