-- QuantMind Migration 011 — Support Escalation & Tags

alter table public.support_tickets add column if not exists tags text[];
alter table public.support_tickets add column if not exists metadata jsonb default '{}';
alter table public.support_tickets add column if not exists assigned_to uuid references auth.users(id);

create table if not exists public.knowledge_base_articles (
  id              uuid          primary key default gen_random_uuid(),
  title           text          not null,
  slug            text          not null unique,
  content         text          not null,
  category        text          not null,
  tags            text[],
  is_published    boolean       not null default false,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

alter table public.knowledge_base_articles enable row level security;

create policy "Anyone can read published articles"
  on public.knowledge_base_articles for select
  using (is_published = true);
