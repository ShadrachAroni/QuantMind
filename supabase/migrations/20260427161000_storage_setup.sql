-- Migration for MiroFish and Simulation Storage Buckets
-- Created: April 2027

-- 1. Create the buckets
insert into storage.buckets (id, name, public)
values ('mirofish-snapshots', 'mirofish-snapshots', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('simulation-results', 'simulation-results', false)
on conflict (id) do nothing;

-- 2. Enable RLS on the objects table
-- Policies for mirofish-snapshots
create policy "Users can upload their own MiroFish snapshots"
on storage.objects for insert
with check (
    bucket_id = 'mirofish-snapshots' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own MiroFish snapshots"
on storage.objects for select
using (
    bucket_id = 'mirofish-snapshots' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policies for simulation-results (Monte Carlo)
create policy "Users can upload their own simulation results"
on storage.objects for insert
with check (
    bucket_id = 'simulation-results' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own simulation results"
on storage.objects for select
using (
    bucket_id = 'simulation-results' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
