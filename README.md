# PanelOps

A campus-recruitment **panel & interview queue tracker**. Room coordinators create
*rooms* (each with an admin PIN and a normal PIN), add interview panels inside a room,
and everyone else joins the room with its code + PIN. Panels are kanban boards —
candidates wait in a queue, get called for their interview, and move to done.

Built with Next.js 16 (App Router, PPR, Server Actions), better-auth (Google-only
sign-in), Prisma 7 + Neon, Tailwind v4, next-safe-action, PostHog and Vercel Analytics.

## Features

- **Google-only sign-in (better-auth)** — no passwords, no roll-number form. Sessions
  live in the database (`User`/`Session`/`Account`), are served as httpOnly
  `better-auth.session_token` cookies, and are optimistically gated in `proxy.ts` so
  protected routes redirect with a real `307` before any rendering. `/join` shows the
  Google button; a signed-in browser hitting `/join` bounces to `/rooms`.
- **Rooms hub** (`/rooms`) — every room you belong to, plus *create a room* (you become
  its admin; set a 4–12 char admin PIN and a different normal PIN) and *join a room*
  (code + PIN). The PIN you enter decides your role: admin PIN → `ADMIN`, normal PIN →
  `USER`; rejoining re-applies the role. Join attempts are throttled per IP+code.
- **Live board** (`/rooms/[roomId]/board`) — tiles + one card per active panel with
  queue depth and live waiting/in-interview/done counts. Room admins see every panel;
  members see only the panels they joined.
- **Kanban per panel** (`/rooms/[roomId]/board/[panelId]`) — Waiting → In interview →
  Done columns with drag & drop (dnd-kit) *and* explicit Start/Done/Reopen buttons,
  elapsed interview timers, and completion durations. Members join a panel from its
  board page or the directory.
- **Panels directory** (`/rooms/[roomId]/panels`) — every active panel in the room,
  searchable; join/leave and jump straight into the board.
- **Control room** (`/rooms/[roomId]/admin/panels`, room admins) — create/edit/archive/
  delete panels (unique per room), manage who staffs each panel, remove members from
  panels.
- **Members** (`/rooms/[roomId]/admin/members`, room admins) — promote/demote/remove
  room members (self-demotion and self-removal are blocked server-side).
- **Toasts, modals, confirm dialogs** and a consistent design-token UI kit.
- **Responsive 320px → 1920px** — verified with real-browser screenshot audits at
  every breakpoint (phone, tablet, laptop, wide desktop) plus modal/dialog states:
  icon-only nav on phones, edge-to-edge swipeable kanban columns, admin tables that
  scroll inside their card and surface priority columns and actions first, and 44px
  touch targets on every interactive control.
- **Analytics** — PostHog heatmaps + autocapture (proxied through `/ingest` so no
  third-party cookies), PostHog **frequency** page views, server-side domain events
  captured out-of-band with `after()`, plus Vercel Analytics and Speed Insights.
- **SEO** — per-page titles/descriptions, canonical URLs, Open Graph + Twitter
  `summary_large_image` (generated 1200×630 PNG), `WebApplication` JSON-LD,
  `robots.txt` + `sitemap.xml`, and `noindex` on every authenticated route.

## Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | Next.js 16.4 (App Router, `cacheComponents`/PPR, `proxy.ts`) |
| Language   | TypeScript (strict) |
| Database   | PostgreSQL 17 — Neon in prod, Docker locally |
| ORM        | Prisma 7 + `@prisma/adapter-pg` driver adapters |
| Validation | Zod 4 |
| Server actions | next-safe-action 8 (typed errors, `authedClient` + in-action room asserts) |
| Auth       | better-auth 1.7 (Google OAuth, Prisma adapter, DB sessions) |
| Styling    | Tailwind CSS v4 + design tokens, motion (Framer successor) |
| DnD       | @dnd-kit |
| Analytics  | PostHog (JS + Node), Vercel Analytics, Vercel Speed Insights |
| Testing    | Vitest (unit + component), Playwright (e2e), Biome (lint/format) |

## Getting started

**Prerequisites:** Node ≥ 20 (developed on 26), Docker, npm.

```bash
npm install                     # runs prisma generate via postinstall
cp .env.example .env            # then set BETTER_AUTH_SECRET:
openssl rand -hex 32            #   paste output as BETTER_AUTH_SECRET

npm run db:up                   # docker compose: dev DB :5433, test DB :5434
npm run db:migrate              # apply migrations
npm run db:seed                 # demo room + panels + fixed local session tokens

npm run dev                     # http://localhost:3100
```

### Signing in locally

Real sign-in needs Google OAuth credentials (see
[Environment variables](#environment-variables)). For local browsing without them, the
seed installs fixed sessions — open devtools and set the cookie
`better-auth.session_token` for `http://localhost:3100` to the **signed value printed
by `npm run db:seed`** (better-auth signs session cookies with `BETTER_AUTH_SECRET`;
the raw token on its own is rejected):

| Seed session token   | Account               | Role in the demo room      |
| --------------------- | --------------------- | -------------------------- |
| `dev-session-admin`   | `admin@panelops.dev`  | ADMIN                      |
| `dev-session-member`  | `member@panelops.dev` | USER (2 panels joined)     |
| `dev-session-outsider`| `outsider@panelops.dev` | not in any room (join-flow testing) |

The e2e suite plants the same signed cookies — no Google round-trip in tests.

### Demo room (seeded)

| Field       | Value                                    |
| ----------- | ---------------------------------------- |
| Name / code | Demo Room / `DEMO42`                     |
| Admin PIN   | `7331`                                   |
| Normal PIN  | `1234`                                   |
| Panels      | Web Development, Data Science, UI/UX Design, DevOps & Cloud (Web Development has a sample queue) |

`npm run db:seed` is idempotent — re-run it any time to restore this state.

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
  transitions), every shared zod schema (rooms, pins, panels, candidates),
  formatting utils, and UI primitives (Button, ToastProvider).
- **E2E (`npm run test:e2e`)** — fully self-contained: a `webServer` script resets and
  seeds the **dedicated test database on :5434**, builds the app and serves it on
  **port 3110**, then runs Chromium specs covering cookie-seeded auth + redirects, the
  rooms hub (create room, join by code+PIN, PIN errors, role upgrade on rejoin), the
  full kanban lifecycle (add → start → done → remove), directory join/leave/search,
  and control-room panel CRUD + role management. Sessions are planted as
  `better-auth.session_token` cookies, so no Google credentials are needed. It never
  touches your dev server (:3100) or dev database (:5433).

## How it fits together

```
proxy.ts ── optimistic gate (better-auth cookie read only): /rooms* needs a cookie →
   │         307 to /join; /join with a cookie → 307 to /rooms
   │
app/(app)/layout.tsx ── auth check (defense in depth; keeps PPR static shell + streaming)
   │
app/(app)/rooms/[roomId]/layout.tsx ── room-membership guard + room-aware header/nav
   │
lib/auth.ts ── betterAuth instance (Google + Prisma adapter), getCurrentUser (cached),
   │           requireRoom*/requirePanel* guards (role checks used by pages & actions)
   │
lib/safe-action.ts ── actionClient / authedClient (next-safe-action, Zod input schemas
   │                  from lib/schemas.ts, ActionError codes; auth via the session)
   │
lib/actions/* ── rooms (create/join+throttle), panels, candidates, users — authorization
   │             via requireRoom*/requirePanel* + transactional position bookkeeping
   │
lib/logic/candidates.ts ── pure transition rules (unit tested, no I/O)
lib/data/queries.ts ── all reads, scoped by roomId (hub, board, panel, directory, admin)
```

Key decisions worth knowing:

- **Optimistic redirect in `proxy.ts`** — redirecting inside a streamed Suspense hole
  yields a `200` with an embedded flight redirect; the proxy (cookie read only, no DB)
  guarantees real `307`s for document and RSC requests, while the room layout still
  re-validates membership against the database once data loads. A stale cookie bounces
  through `/api/session/clear`, which wipes the cookie — no `/join` ⇄ `/rooms` loop.
- **Room roles, not global roles** — a user's `ADMIN`/`USER` role lives in
  `RoomMembership`; panel CRUD and member management assert room admin *inside* each
  action (`requireRoomAdminContext` etc.), so forged requests fail server-side.
- **Server actions must live in `"use server"` files**; `redirect()` re-throws through
  next-safe-action and is handled by the client hooks (`useAction`).
- **Board freshness** is SSR + server actions calling `router.refresh()` — no WebSocket
  layer, no client state duplication, no polling; the server is the source of truth.
- **PostHog server events** are queued inside `after()` so tracking never delays a
  response; distinct id is `user:<id>` (matching the client-side `posthog.identify` in
  IdentityBridge) with room role attached per event.

## Environment variables

See [`.env.example`](.env.example):

| Var | Purpose |
| --- | ------- |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | app + direct (migrations) strings — Neon in prod, Docker locally |
| `BETTER_AUTH_SECRET` | better-auth signing secret, ≥ 32 chars (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | base URL of the app (OAuth callbacks), e.g. `http://localhost:3100` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client (empty = sign-in button errors gracefully; use seeded sessions locally) |
| `NEXT_PUBLIC_APP_URL` | public origin for canonical/OG/sitemap/robots URLs (defaults to `http://localhost:3100`) |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` / `_KEY` / `_HOST` / `_UI_HOST` | PostHog project key (either name works) + API/UI hosts (empty = no-op) |

## Deploying (Vercel + Neon + Google)

1. Create a Neon project; use the **pooled** connection string for `DATABASE_URL` and
   the **direct** string for `DATABASE_URL_UNPOOLED`.
2. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create
   an OAuth 2.0 Client (type: Web application) with authorized redirect URI
   `https://<your-domain>/api/auth/callback/google` (plus
   `http://localhost:3100/api/auth/callback/google` for local). Copy the client id and
   secret.
3. Push the repo to GitHub and import it in Vercel. Set the env vars above —
   `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the production origin,
   `BETTER_AUTH_SECRET` to a fresh `openssl rand -hex 32`, and the Google credentials.
   The `vercel-build` script runs `prisma generate && prisma migrate deploy && next
   build` (migrations ship in `prisma/migrations`).
4. Enable Web Analytics and Speed Insights in the Vercel dashboard (no env needed).
5. Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (and host, if not using the US cloud) if you
   want heatmaps + frequency analytics; the browser SDK reports through the `/ingest`
   rewrite in `next.config.ts` for cookie-free tracking.

## Project layout

```
app/
  page.tsx                 landing (static, WebApplication JSON-LD)
  join/                    Google sign-in page (+ client button)
  api/auth/[...all]/       better-auth handler (toNextJsHandler)
  api/session/clear/       stale-cookie escape hatch (clears cookie → /join)
  robots.ts sitemap.ts     crawl rules + sitemap (from NEXT_PUBLIC_APP_URL)
  opengraph-image.tsx      generated OG/Twitter card image (1200×630)
  (app)/rooms/             hub (create/join room) + [roomId] layout & pages:
    [roomId]/board/        panel overview + [panelId] kanban
    [roomId]/panels/       directory
    [roomId]/admin/        control room + members (room-admin gated, noindex)
lib/
  auth.ts, auth-client.ts  betterAuth server instance, guards, browser client
  actions/                 server actions (rooms, panels, candidates, users)
  logic/                   pure domain rules (unit tested)
  data/queries.ts          all reads (roomId-scoped)
  site.ts                  site-wide URL/name constants
components/
  board/ panels/ admin/    feature UI
  shell/header.tsx         room-aware nav + sign-out
  ui/                      design system primitives
e2e/                       Playwright specs + self-contained serve/reset scripts
prisma/                    schema, migrations (0_init), seed (users/rooms/panels)
```
