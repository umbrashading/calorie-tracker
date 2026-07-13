# Calorie Tracker

Private household calorie tracking app with AI-assisted intake and burn logging.

## Setup

### 1. Environment variables (Vercel)

Add these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `CLAUDE_MODEL_ID` | Claude model ID (default: `claude-sonnet-5`) |

Redeploy after adding or changing variables.

For local development, copy [`.env.local.example`](./.env.local.example) to `.env.local` and fill in the same values.

### 2. Database migrations

**Cursor agents** can run `npm run db:push` if you add the Supabase secrets to your **Cursor Cloud Environment** (see [`supabase/README.md`](./supabase/README.md)). Vercel env vars alone are not enough for agents.

Alternatively, run the SQL files manually in the Supabase SQL Editor — same instructions in [`supabase/README.md`](./supabase/README.md).

### 3. Create users

1. Supabase Dashboard → **Authentication** → disable **Enable email signups**
2. **Authentication → Users** → add both household accounts manually

### 4. Deploy

Push to GitHub; Vercel deploys automatically.

**Use the URL from Vercel → Deployments → latest Production → Visit.** Do not use stale `*.vercel.app` links (including the GitHub repo homepage) if they return 404.

## Vercel troubleshooting

### `404: NOT_FOUND` (plain Vercel error page)

The build likely succeeded, but the domain you opened is not attached to a deployment.

1. **Vercel → calorie-tracker → Deployments** → open the latest green **Production** deployment → **Visit**
2. **Settings → Domains** → check your production domain (e.g. `calorie-tracker-blush-nu.vercel.app`). If it errors or is missing, remove and re-add it, then redeploy.

### Redirected to Vercel login

**Deployment Protection** is on. For this app (Supabase handles login):

1. **Settings → Deployment Protection**
2. Disable **Vercel Authentication** for **Production** (and Preview if needed)

### `No Output Directory named "public"`

**Settings → Build & Deployment** → Framework: **Next.js**, Output Directory: **blank**.

## Implementation Plan

See [`docs/implementation-plan.md`](./docs/implementation-plan.md) for the full build roadmap.

## Current Status

- **Milestone 1** — Scaffold ✅
- **Milestone 2** — Schema + Auth ✅ (migrations, middleware, login, dashboard stub)
