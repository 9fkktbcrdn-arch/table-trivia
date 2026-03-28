-- Table Trivia — initial schema
-- Run in Supabase SQL editor (or via CLI) before using the app.

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  difficulty text not null,
  score integer not null,
  mode text not null default 'standard',
  player_name text,
  created_at timestamptz not null default now()
);

create index if not exists topics_sort_order_idx on public.topics (sort_order);
create index if not exists scores_created_at_idx on public.scores (created_at desc);

-- No auth: allow anon read/write for family devices (use anon key in the app).
-- Adjust if you enable RLS later.

alter table public.topics enable row level security;
alter table public.scores enable row level security;

create policy "topics open" on public.topics for all using (true) with check (true);
create policy "scores open" on public.scores for all using (true) with check (true);
