-- Resting baseline uses BMR × 1.2 (sedentary living). Walking is estimated from average
-- daily steps when no step count is logged, or from actual steps when entered.

create or replace view public.daily_summary
with (security_invoker = true)
as
with profile_baselines as (
  select
    p.id as user_id,
    p.display_name,
    p.avatar_emoji,
    p.weight_kg,
    p.timezone,
    coalesce(p.average_daily_steps, 8000) as average_daily_steps,
    case
      when p.sex = 'male' then 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5
      when p.sex = 'female' then 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161
      else null
    end as bmr
  from public.profiles p
),
activity_dates as (
  select
    ie.user_id,
    (ie.logged_at at time zone pb.timezone)::date as entry_date
  from public.intake_entries ie
  join profile_baselines pb on pb.user_id = ie.user_id

  union

  select
    be.user_id,
    (be.logged_at at time zone pb.timezone)::date as entry_date
  from public.burn_entries be
  join profile_baselines pb on pb.user_id = be.user_id

  union

  select ds.user_id, ds.entry_date
  from public.daily_steps ds
),
intake_by_day as (
  select
    ie.user_id,
    (ie.logged_at at time zone pb.timezone)::date as entry_date,
    sum(ie.calories)::integer as calories_in
  from public.intake_entries ie
  join profile_baselines pb on pb.user_id = ie.user_id
  group by ie.user_id, (ie.logged_at at time zone pb.timezone)::date
),
burn_by_day as (
  select
    be.user_id,
    (be.logged_at at time zone pb.timezone)::date as entry_date,
    sum(be.calories)::integer as exercise_calories
  from public.burn_entries be
  join profile_baselines pb on pb.user_id = be.user_id
  group by be.user_id, (be.logged_at at time zone pb.timezone)::date
)
select
  pb.user_id,
  ad.entry_date,
  pb.display_name,
  pb.avatar_emoji,
  coalesce(ibd.calories_in, 0) as calories_in,
  round(pb.bmr * 1.2)::integer as baseline_calories,
  coalesce(ds.steps, pb.average_daily_steps) as steps,
  round(
    coalesce(ds.steps, pb.average_daily_steps) * 0.0005 * coalesce(pb.weight_kg, 0)
  )::integer as steps_calories,
  coalesce(bbd.exercise_calories, 0) as exercise_calories,
  (
    round(pb.bmr * 1.2)
    + round(coalesce(ds.steps, pb.average_daily_steps) * 0.0005 * coalesce(pb.weight_kg, 0))
    + coalesce(bbd.exercise_calories, 0)
  )::integer as calories_out_total,
  (
    coalesce(ibd.calories_in, 0)
    - (
      round(pb.bmr * 1.2)
      + round(coalesce(ds.steps, pb.average_daily_steps) * 0.0005 * coalesce(pb.weight_kg, 0))
      + coalesce(bbd.exercise_calories, 0)
    )
  )::integer as net_calories
from activity_dates ad
join profile_baselines pb on pb.user_id = ad.user_id
left join intake_by_day ibd
  on ibd.user_id = ad.user_id and ibd.entry_date = ad.entry_date
left join burn_by_day bbd
  on bbd.user_id = ad.user_id and bbd.entry_date = ad.entry_date
left join public.daily_steps ds
  on ds.user_id = ad.user_id and ds.entry_date = ad.entry_date;
