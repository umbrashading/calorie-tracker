# Calorie Tracker App — Implementation Plan

## Context

This is a private, two-user (household) calorie tracking app for the user and his wife, built around AI-chatbot-driven logging rather than manual food databases or barcode scanning. The repo is currently empty (git-initialized only), so this is a full greenfield build. The user has already decided on the stack: Next.js (App Router, TypeScript, npm) on Vercel, Supabase for Postgres/Auth/Storage (project already exists, credentials to be supplied as env vars later), and the Anthropic Claude API called server-side for both text and vision-based calorie estimation. Auth is login-only — no public signup — since the two users will be created manually via the Supabase dashboard. The goal of this plan is to stand up the full v1 feature set (intake logging, burn logging, dashboard, history, mobile polish) in priority order, with each milestone independently verifiable.

## Tech Stack & Key Decisions

- Next.js 14+ App Router, TypeScript, Tailwind CSS, npm
- Supabase: Postgres + Auth + Storage, via `@supabase/ssr` (not the deprecated auth-helpers package)
- Anthropic Claude via `@anthropic-ai/sdk`, model id `claude-sonnet-5` behind a `CLAUDE_MODEL_ID` env var/constant (never hardcoded inline), using structured JSON output (`output_config.format: json_schema`) for reliable parsing
- Auth: login-only (`app/login/page.tsx`), no signup route; both users created manually in Supabase Studio → Auth → Users; a `handle_new_user()` trigger auto-creates their `profiles` row
- Env vars (not filled in yet): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL_ID`
- No test framework added for v1 — verification is manual (curl + browser + Supabase SQL Editor), consistent with "no existing test setup"

## Folder Structure

```
calorie-tracker/
├─ middleware.ts                    # session refresh + route protection (login-only gate)
├─ app/
│  ├─ login/page.tsx                # only public route — email+password via Supabase Auth
│  ├─ (app)/                        # auth-required route group, shared layout w/ bottom nav
│  │  ├─ layout.tsx
│  │  ├─ dashboard/page.tsx
│  │  ├─ log/{intake,burn}/page.tsx
│  │  ├─ history/{page.tsx,[date]/page.tsx}
│  │  └─ profile/page.tsx
│  ├─ manifest.ts                   # PWA manifest for "Add to Home Screen"
│  └─ api/
│     ├─ chat/{intake,burn}/route.ts    # Claude calls
│     ├─ intake-entries/route.ts        # POST confirm+save, GET list
│     ├─ burn-entries/route.ts
│     ├─ steps/route.ts                 # upsert today's step count
│     ├─ profile/route.ts
│     └─ summary/route.ts               # daily_summary for dashboard + history
├─ components/{chat,dashboard,history,profile,nav,ui}/...
├─ lib/
│  ├─ supabase/{client.ts,server.ts}    # browser vs server Supabase clients
│  ├─ claude/{client.ts,constants.ts,prompts.ts,schemas.ts}
│  ├─ calc/{bmr.ts,steps.ts,summary.ts}
│  ├─ types/{database.ts,chat.ts}
│  └─ utils/{auth.ts,date.ts}
└─ supabase/migrations/
   0001_profiles.sql … 0006_rls_policies.sql
```

## Database Schema (Supabase Postgres)

- **`profiles`** — extends `auth.users`: `display_name`, `avatar_emoji`, `age`, `sex`, `height_cm`, `weight_kg`, `activity_level`, `daily_calorie_target`, `timezone`. A `handle_new_user()` trigger on `auth.users` insert auto-creates a placeholder profile whenever the owner adds a user via the dashboard.
- **`intake_entries`** — `user_id`, `logged_at`, `description`, `calories`, `confidence` (high/medium/low), `assumptions`, `image_path` (Storage path), `raw_model_response` (jsonb, for audit).
- **`burn_entries`** — same shape plus `exercise_type`, `duration_minutes`, `intensity`.
- **`daily_steps`** — separate table (not append-only like the entries above): one row per `(user_id, entry_date)`, upserted, since step count is a running total the user edits, not a log of discrete events.
- **`daily_summary`** — a Postgres **view** (not app-computed), created `with (security_invoker = true)` so it respects RLS as the querying user. Joins the three tables above with `profiles`, computing baseline via Mifflin-St Jeor BMR × activity multiplier, steps→calories via `steps * 0.0005 * weight_kg`, and `calories_out_total = baseline + steps + exercise`. Rationale: single shared aggregation logic for both the dashboard ("today") and history (date ranges), avoiding drift between two hand-rolled implementations. Known v1 simplification: baseline uses the *current* profile row, not a historical snapshot — acceptable since biometrics are updated rarely in a 2-person household.
- **Storage**: private `meal-photos` bucket, path convention `<user_id>/<uuid>.<ext>`.
- **RLS**: shared household read (`using (true)` on all `select` policies) but own-row-only `insert`/`update`/`delete` (`auth.uid() = user_id`), on `intake_entries`, `burn_entries`, `daily_steps`, `profiles`, and `storage.objects` for the photo bucket.

## Auth & Middleware

- `lib/supabase/server.ts` (`createServerClient` + `cookies()`) for Server Components/Route Handlers; `lib/supabase/client.ts` (`createBrowserClient`) for Client Components.
- Root `middleware.ts` refreshes the session cookie on every request and redirects unauthenticated users to `/login` (and authenticated users away from `/login`), following the standard `@supabase/ssr` Next.js middleware pattern.
- Every `app/api/**/route.ts` independently re-checks `auth.getUser()` and 401s if absent — defense in depth beyond the middleware matcher.
- No signup UI is built; the user should also disable "Enable email signups" in the Supabase Auth dashboard settings as a manual one-time step.

## Chatbot Flow (Intake & Burn)

1. Client `ChatWindow` component posts `{ messages, newUserMessage, imageBase64?, imageMediaType? }` to `/api/chat/intake` (or `/burn`).
2. Route handler checks auth, uploads any attached image to Supabase Storage, builds an Anthropic `messages` array (image block + text block when present), and calls `claude.messages.create` with a JSON-schema-constrained structured output.
3. Response shape: `{ reply, needsClarification, clarifyingQuestion?, result?, imagePath? }`. If `needsClarification`, the UI shows the follow-up question and loops back to step 1 with the user's answer (text-only on follow-ups). Otherwise it renders a `ConfirmCard` with the parsed `result` (calories, description of assumptions, confidence).
4. On Confirm, the client POSTs the confirmed fields to `/api/intake-entries` (or `/burn-entries`), which inserts the row server-side with `user_id` from the session (RLS enforces ownership regardless).
5. Burn mode additionally fetches the caller's own `profiles` row and injects biometrics into the system prompt (`buildBurnSystemPrompt(profile)`) so Claude can estimate exercise calories using age/sex/height/weight/activity level, asking about intensity/duration when it materially changes the estimate.
6. Model id, prompts, and JSON schemas live in `lib/claude/{constants,prompts,schemas}.ts` — isolated so prompt tuning doesn't touch route handler logic.

## Build Order (each milestone independently verifiable)

1. **Scaffold** — `create-next-app`, folder skeleton, `.env.local.example`. Verify: `npm run dev`/`npm run build` succeed.
2. **Schema + Auth** — apply all 6 migrations to the user's existing Supabase project; build middleware, Supabase clients, login page, minimal authenticated dashboard stub. Verify: unauthenticated redirect to `/login`; log in as both manually-created users in separate browser sessions; confirm shared read / own-write RLS behavior via curl and cross-user write attempts.
3. **Intake chatbot (text-only)** — chat route, prompts/schemas, entries route, ChatWindow UI. Verify: curl a vague description (expect clarification), then a clear one (expect a sane estimate); confirm-save produces a correctly-attributed row.
4. **Intake chatbot (+ images)** — Storage bucket/policies, image upload + vision call, attach-photo UI. Verify: nutrition-label photo produces an estimate referencing label values; storage object is private but readable by the other household member.
5. **Burn tracking** — profile form/route, `bmr.ts`/`steps.ts` calc helpers, steps input, burn chat + entries route. Verify: hand-compute BMR for known profile values and compare to `/api/summary`; vague exercise description triggers clarification; repeated same-day step POSTs upsert rather than duplicate.
6. **Daily dashboard** — `/api/summary` route, per-user summary cards. Verify: seed known rows for both users, confirm totals match hand-computed sums and one user's card is unaffected by the other's entries.
7. **History view** — week-paginated list + day-detail drill-down, backed by `/api/summary` date ranges. Verify: backdated rows render in correct chronological order with correct per-user attribution.
8. **Mobile polish** — bottom tab nav, PWA manifest, safe-area padding, 16px minimum input font (prevents iOS auto-zoom), sticky chat composer. Verify: Chrome DevTools device emulation at iPhone SE and larger widths, one-handed reachability of primary actions, Add-to-Home-Screen installs correctly.

## Critical Files

- `supabase/migrations/0001…0006.sql` — schema, auth trigger, RLS, and the `daily_summary` view; everything else depends on this
- `middleware.ts` — enforces the login-only auth model app-wide
- `app/api/chat/intake/route.ts` — the core chatbot contract (Claude call, structured output, image handling)
- `lib/claude/prompts.ts` — where estimation quality and the clarification-loop behavior actually live
- `app/api/summary/route.ts` — single source of truth consumed by both dashboard and history

## Verification Approach

No automated test framework for v1. Verify via: curl replaying a browser session cookie against Route Handlers (fast Claude-prompt iteration without the UI); Supabase SQL Editor for seeding backdated data and eyeballing RLS; two real logged-in browser sessions (incognito + normal) to catch RLS policies scoped too broadly/narrowly; Chrome DevTools responsive mode per UI milestone for mobile checks.
