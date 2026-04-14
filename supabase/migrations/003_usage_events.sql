-- Append-only AI usage for token/cost totals (shared across devices via anon key).
-- Re-running is safe: policy is dropped before recreate.

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'unknown',
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_usd numeric(14, 6) not null default 0 check (estimated_cost_usd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_created_at_idx on public.usage_events (created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "usage_events open" on public.usage_events;

create policy "usage_events open" on public.usage_events for all using (true) with check (true);

comment on table public.usage_events is 'Aggregated AI call usage; insert from app API routes; sum for dashboard.';
