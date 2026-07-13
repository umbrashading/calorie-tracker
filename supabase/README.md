# Supabase migrations

## Option A — Cursor / CLI (recommended)

If your **Cursor Cloud Environment** has the migration secrets set, an agent can run:

```bash
npm run db:push
```

### Secrets to add in Cursor

In **Cursor → Cloud → Environments** (for this repo), add:

| Secret | Where to find it |
|--------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same |
| `SUPABASE_ACCESS_TOKEN` | [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Supabase → Project Settings → Database |

`SUPABASE_PROJECT_REF` is optional — it is parsed from `NEXT_PUBLIC_SUPABASE_URL` automatically.

Vercel env vars are **not** visible to Cursor agents. Add the same values to your Cursor Cloud Environment if you want agents to run migrations or test against your database.

### Local

```bash
cp .env.local.example .env.local
# fill in values, then:
npm run db:push
```

## Option B — Supabase SQL Editor (manual)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run each file in `supabase/migrations/` in numeric order:
   - `0001_profiles.sql`
   - `0002_intake_entries.sql`
   - `0003_burn_entries.sql`
   - `0004_daily_steps.sql`
   - `0005_daily_summary.sql`
   - `0006_rls_policies.sql`

## After migrations

1. In **Authentication → Providers**, disable **Enable email signups** (login-only household app)
2. In **Authentication → Users**, manually create both household accounts
3. Each new user automatically gets a `profiles` row via the `handle_new_user()` trigger

## Verify RLS

With two users logged in (normal + incognito browser):

- Both users can **read** each other's entries and profiles
- Each user can only **insert/update/delete** their own rows
