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

Run the SQL migrations in [`supabase/migrations/`](./supabase/migrations/) against your Supabase project. See [`supabase/README.md`](./supabase/README.md) for step-by-step instructions.

### 3. Create users

1. Supabase Dashboard → **Authentication** → disable **Enable email signups**
2. **Authentication → Users** → add both household accounts manually

### 4. Deploy

Push to GitHub; Vercel deploys automatically. Visit your Vercel URL and sign in.

## Implementation Plan

See [`docs/implementation-plan.md`](./docs/implementation-plan.md) for the full build roadmap.

## Current Status

- **Milestone 1** — Scaffold ✅
- **Milestone 2** — Schema + Auth ✅ (migrations, middleware, login, dashboard stub)
