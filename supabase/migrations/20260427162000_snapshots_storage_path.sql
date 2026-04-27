-- Migration to add storage_path to simulation_snapshots
-- Created: April 2027

alter table public.simulation_snapshots 
add column if not exists storage_path text;

create index if not exists simulation_snapshots_storage_path_idx on public.simulation_snapshots(storage_path);
