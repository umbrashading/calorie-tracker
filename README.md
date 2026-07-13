# Calorie Tracker

Private household calorie tracking app with AI-assisted intake and burn logging.

## Setup

1. Copy the environment template and fill in your credentials:

```bash
cp .env.local.example .env.local
```

2. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Environment Variables

See [`.env.local.example`](./.env.local.example) for all required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `CLAUDE_MODEL_ID` | Claude model ID (default: `claude-sonnet-5`) |

## Implementation Plan

See [`docs/implementation-plan.md`](./docs/implementation-plan.md) for the full build roadmap.

## Current Status

**Milestone 1 — Scaffold** complete: Next.js app, folder skeleton, env template.
