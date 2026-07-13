create table public.intake_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_at timestamptz not null default now(),
  description text not null,
  calories integer not null check (calories >= 0),
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  assumptions text,
  image_path text,
  raw_model_response jsonb,
  created_at timestamptz not null default now()
);

create index intake_entries_user_logged_at_idx
  on public.intake_entries (user_id, logged_at desc);

create index intake_entries_logged_at_idx
  on public.intake_entries (logged_at desc);
