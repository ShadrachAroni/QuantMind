-- Migration 025 — April 2027
-- Support for Snapshot Marketplace

create table public.snapshot_listings (
    id uuid primary key default gen_random_uuid(),
    snapshot_id uuid references public.simulation_snapshots(id) on delete cascade,
    seller_id uuid references auth.users(id) on delete cascade,
    price_xp integer not null default 100,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.snapshot_listings enable row level security;

create policy "Anyone can view active listings"
    on public.snapshot_listings for select
    using (is_active = true);

create policy "Sellers can manage their own listings"
    on public.snapshot_listings for all
    using (auth.uid() = seller_id);

-- Track sales
create table public.snapshot_sales (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid references public.snapshot_listings(id),
    buyer_id uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.snapshot_sales enable row level security;

create policy "Users can view their own purchases"
    on public.snapshot_sales for select
    using (auth.uid() = buyer_id);
