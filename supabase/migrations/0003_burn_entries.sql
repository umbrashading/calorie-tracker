create table public.burn_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  description text not null,
  calories integer not null check (calories >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  assumptions text,
  exercise_type text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  intensity text,
  raw_model_response jsonb,
  created_at timestamptz not null default now()
);

create index burn_entries_user_logged_at_idx
  on public.burn_entries (user_id, logged_at desc);

create index burn_entries_logged_at_idx
  on public.burn_entries (logged_at desc);
