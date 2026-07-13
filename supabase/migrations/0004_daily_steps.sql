create table public.daily_steps (
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  steps integer not null default 0 check (steps >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

create index daily_steps_entry_date_idx
  on public.daily_steps (entry_date desc);
