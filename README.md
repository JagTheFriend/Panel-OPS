# PanelOps

A campus-recruitment **panel & domain status tracker**. Interview panels ("domains") are
kanban boards — participants wait in a queue, get called for their interview, and move to
done when finished.

Built with Next.js 16 (App Router, PPR, Server Actions), Prisma 7 + Neon, Tailwind v4,
next-safe-action, PostHog and Vercel Analytics.

## Features

- **Roll number + PIN auth** — no passwords. A shared room PIN signs participants in
  (unknown roll numbers are onboarded automatically); the admin PIN upgrades you to the
  `ADMIN` role. Sessions are httpOnly iron-session cookies, optimistically gated in
  `proxy.ts` so protected routes redirect with a real `307` before any rendering.
- **Live board overview** (`/board`) — every panel you belong to, with queue depth
  and live waiting/in-interview/done counts.
- **Kanban per panel** (`/board/[panelId]`) — Waiting → In interview → Done columns with
  drag & drop (dnd-kit) *and* explicit Start/Done/Reopen buttons, elapsed interview
  timers, and completion durations.
- **Panels directory** (`/panels`) — searchable list of active domains; join/leave and
  jump straight into the board.
- **Control room** (`/admin/panels`, admin only) — create/edit/archive/delete panels,
  manage members per panel, and remove members from panels.
- **Members** (`/admin/members`, admin only) — promote/demote/delete users (self-demotion
  and self-deletion are blocked server-side).
- **Toasts, modals, confirm dialogs** and a consistent design-token UI kit.
- **Mobile-friendly** — verified with real-browser audits from 320px up: icon-only nav
  on phones, edge-to-edge swipeable kanban columns, admin tables that surface priority
  columns and actions first, and 44px touch targets on every interactive control.
- **Analytics** — PostHog heatmaps + autocapture (proxied through `/ingest` so no
  third-party cookies), PostHog **frequency** page views, server-side domain events
  captured out-of-band with `after()`, plus Vercel Analytics and Speed Insights.

## Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | Next.js 16.4 (App Router, `cacheComponents`/PPR, `proxy.ts`) |
| Language   | TypeScript (strict) |
| Database   | PostgreSQL 17 — Neon in prod, Docker locally |
| ORM        | Prisma 7 + `@prisma/adapter-pg` driver adapters |
| Validation | Zod 4 |
| Server actions | next-safe-action 8 (typed errors, `authed`/`admin` clients) |
| Auth       | iron-session (sealed cookie, no server sessions table) |
| Styling    | Tailwind CSS v4 + design tokens, motion (Framer successor) |
| DnD       | @dnd-kit |
| Analytics  | PostHog (JS + Node), Vercel Analytics, Vercel Speed Insights |
| Testing    | Vitest (unit + component), Playwright (e2e), Biome (lint/format) |

## Getting started

**Prerequisites:** Node ≥ 20 (developed on 26), Docker, npm.

```bash
npm install                     # runs prisma generate via postinstall
cp .env.example .env            # then set SESSION_SECRET:
openssl rand -hex 32            #   paste output as SESSION_SECRET

npm run db:up                   # docker compose: dev DB :5433, test DB :5434
npm run db:migrate              # apply migrations
npm run db:seed                 # demo panels, users and queue data

npm run dev                     # http://localhost:3100
```

Seeded logins (local only):

| Roll      | PIN    | Role  |
| --------- | ------ | ----- |
| `9001`    | `7331` | ADMIN |
| any numeric roll | `1234` | USER (new rolls are created on first join; name + at least one domain are required) |

`9002` exists as a regular user for role-flip testing.

## Scripts

| Script | What it does |
| ------ | ------------ |
| `npm run dev` / `start` | Next dev/prod server on **port 3100** |
| `npm run build` / `vercel-build` | build (Vercel adds `prisma migrate deploy`) |
| `npm run lint` / `format` | Biome check / write |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` / `test:coverage` | Vitest unit + component tests |
| `npm run test:e2e` / `test:e2e:ui` | Playwright (self-contained, see below) |
| `npm run db:up` / `db:down` | start/stop dockerized Postgres |
| `npm run db:migrate` / `db:seed` / `db:reset` / `db:studio` | Prisma workflows |
| `npm run verify` | lint → typecheck → db up/reset → unit tests → build → e2e |

> Note: `db:reset` runs the destructive `prisma migrate reset`. Prisma may refuse the
> command when it detects a non-interactive AI/automation environment — run it in a
> normal terminal, or reset only the test DB (the e2e suite does its own reset).

## Testing

- **Unit/component (`npm test`)** — pure domain logic in `lib/logic` (status
  transitions), every shared zod schema, formatting utils, and UI
  primitives (Button, ToastProvider).
- **E2E (`npm run test:e2e`)** — fully self-contained: a `webServer` script resets and
  seeds the **dedicated test database on :5434**, builds the app and serves it on
  **port 3110**, then runs Chromium specs covering auth/redirects, the full kanban
  lifecycle (add → start → done → reopen → remove), directory
  join/leave/search, and admin panel CRUD + role management. It never touches your dev
  server (:3100) or dev database (:5433).

## How it fits together

```
proxy.ts ── optimistic gate: valid session cookie? → 307 to /join before render
   │
app/(app)/layout.tsx ── Suspense-holed session check (defense in depth; keeps
   │                    PPR static shell + streaming) + header/nav
   │
lib/safe-action.ts ── actionClient / authedClient / adminClient (next-safe-action,
   │                  Zod input schemas from lib/schemas.ts, ActionError codes)
   │
lib/actions/* ── panels, candidates, members, users — authorization +
   │             transactional position bookkeeping
   │
lib/logic/candidates.ts ── pure transition rules (unit tested, no I/O)
lib/data/queries.ts ── all reads (board overview, panel board, directory, admin)
```

Key decisions worth knowing:

- **Optimistic redirect in `proxy.ts`** — redirecting inside a streamed Suspense hole
  yields a `200` with an embedded flight redirect; the proxy (cookie read only, no DB)
  guarantees real `307`s for document and RSC requests, while the layout still
  re-validates the session against the database once data loads.
- **Server actions must live in `"use server"` files**; `redirect()` re-throws through
  next-safe-action and is handled by the client hooks (`useAction`).
- **Board freshness** is SSR + server actions calling `router.refresh()` — no WebSocket
  layer, no client state duplication, no polling; the server is the source of truth.
- **PostHog server events** are queued inside `after()` so tracking never delays a
  response; distinct id is `roll:<rollNo>` so product analytics ties back to a person
  without shipping PII to a third party beyond the roll number already in the session.

## Environment variables

See [`.env.example`](.env.example):

| Var | Purpose |
| --- | ------- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | pooled (app) + direct (migrations) Neon/local strings |
| `SESSION_SECRET` | iron-session seal key, ≥ 32 chars (`openssl rand -hex 32`) |
| `ROOM_PIN` / `ADMIN_PIN` | shared participant PIN / admin upgrade PIN |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` / `_KEY` / `_HOST` / `_UI_HOST` | PostHog project key (either name works) + API/UI hosts (empty = no-op) |

## Deploying (Vercel + Neon)

1. Create a Neon project; use the **pooled** connection string for `DATABASE_URL` and the
   **direct** string for `DATABASE_URL_UNPOOLED`.
2. Push the repo to GitHub and import it in Vercel. Set the env vars above (plus
   `ROOM_PIN`/`ADMIN_PIN` — change them from the local defaults). The `vercel-build`
   script runs `prisma generate && prisma migrate deploy && next build`.
3. Enable Web Analytics and Speed Insights in the Vercel dashboard (no env needed).
4. Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (and host, if not using the US cloud) if you
   want heatmaps + frequency analytics; the browser SDK reports through the `/ingest`
   rewrite in `next.config.ts` for cookie-free tracking.

## Project layout

```
app/
  page.tsx                 landing (static)
  join/                    roll + PIN entry (PPR)
  (app)/board/             panel overview + [panelId] kanban
  (app)/panels/            directory
  (app)/admin/             control room + members (admin-gated)
lib/
  actions/                 server actions (next-safe-action)
  logic/                   pure domain rules (unit tested)
  data/queries.ts          all reads
  auth.ts, session.ts      session/authorization helpers
components/
  board/ panels/ admin/    feature UI
  ui/                      design system primitives
e2e/                       Playwright specs + self-contained serve/reset scripts
prisma/                    schema, migrations, seed
```
