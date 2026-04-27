-- Migration 023 — April 2027
-- Support for Supabase Storage based simulation results

-- Add storage_path to simulations table
alter table public.simulations 
add column storage_path text;

-- Add index for storage path
create index simulations_storage_path_idx on public.simulations(storage_path);

-- Optional: We keep simulation_paths for legacy support or delete it later
-- For now, we allow it to be null
alter table public.simulation_paths 
alter column paths drop not null;
