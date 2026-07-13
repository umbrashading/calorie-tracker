-- Profiles extend auth.users with household member metadata.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_emoji text not null default '🙂',
  age integer check (age is null or age between 10 and 120),
  sex text check (sex is null or sex in ('male', 'female')),
  height_cm numeric(5, 1) check (height_cm is null or height_cm > 0),
  weight_kg numeric(5, 1) check (weight_kg is null or weight_kg > 0),
  activity_level text not null default 'moderate' check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  daily_calorie_target integer check (
    daily_calorie_target is null or daily_calorie_target between 500 and 10000
  ),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
