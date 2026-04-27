-- Migration to add storage_path to simulation_runs
-- Created: April 2027

alter table public.simulation_runs 
add column if not exists storage_path text;

create index if not exists simulation_runs_storage_path_idx on public.simulation_runs(storage_path);

-- Optional: Update existing records if we have a way to migrate them
-- For now, we just prepare the schema.
