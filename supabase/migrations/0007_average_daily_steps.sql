-- Average daily steps used as the baseline for step calorie offsets.

alter table public.profiles
  add column if not exists average_daily_steps integer
  default 8000
  check (average_daily_steps is null or average_daily_steps >= 0);
