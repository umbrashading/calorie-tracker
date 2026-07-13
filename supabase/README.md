# Supabase migrations

Run these SQL files **in order** against your Supabase project.

## Option A — Supabase SQL Editor (recommended for this project)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run each file in `supabase/migrations/` in numeric order:
   - `0001_profiles.sql`
   - `0002_intake_entries.sql`
   - `0003_burn_entries.sql`
   - `0004_daily_steps.sql`
   - `0005_daily_summary.sql`
   - `0006_rls_policies.sql`
3. Confirm success after each file (or run all in one batch if you prefer)

## Option B — Supabase CLI

If you use the [Supabase CLI](https://supabase.com/docs/guides/cli) locally:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## After migrations

1. In **Authentication → Providers**, disable **Enable email signups** (login-only household app)
2. In **Authentication → Users**, manually create both household accounts
3. Each new user automatically gets a `profiles` row via the `handle_new_user()` trigger

## Verify RLS

With two users logged in (normal + incognito browser):

- Both users can **read** each other's entries and profiles
- Each user can only **insert/update/delete** their own rows
