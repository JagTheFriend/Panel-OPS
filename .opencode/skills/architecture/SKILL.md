---
name: Architecture
description: Load when tracing or changing request flow, routes, server actions, data queries, or UI structure.
---

# Architecture — request flow

```text
proxy.ts                 cookie-presence gate only (no DB): /rooms* w/o cookie → 307 /join; /join w/ cookie → 307 /rooms
  ↓
app/(app)/layout.tsx     real auth (defense in depth; keeps the PPR static shell)
  ↓
rooms/[roomId]/layout    room-membership guard + room-aware Header
  ↓
page (server)            role asserts via requireRoom*/requirePanel* guards from lib/auth.ts
  ↓
server action            lib/actions/* through next-safe-action; authorization re-asserted in-action
  ↓
router.refresh()         mutations re-render from the server — no client caches, no polling
```

## Routes

| Path | Page |
| --- | --- |
| `/` | static landing (SEO) |
| `/join` | Google sign-in; signed-in browsers bounce to `/rooms` |
| `/rooms` | hub: your rooms + create/join forms |
| `/rooms/[roomId]/board` | panel overview — ADMIN sees all panels, USER only joined ones |
| `/rooms/[roomId]/board/[panelId]` | kanban: Waiting → In interview → Done |
| `/rooms/[roomId]/panels` | directory of every active panel (join/leave) |
| `/rooms/[roomId]/admin/panels` | control room, room ADMIN only |
| `/rooms/[roomId]/admin/members` | member management, room ADMIN only |
| `/api/auth/[...all]` | better-auth handler |
| `/api/session/clear` | stale-cookie escape hatch → clears cookie, redirects `/join` |

Legacy `/board`, `/panels`, `/admin/*` 308-redirect to `/rooms` (`next.config.ts`).

## Key modules

- `lib/auth.ts` — betterAuth instance, `getCurrentUser` (cached), `getRoomContext`, `requireRoomAdminContext`, `requirePanelContext/StaffContext/AdminContext`
- `lib/schemas.ts` — every Zod input schema, all unit-tested
- `lib/safe-action.ts` — `authedClient` (no separate admin client; authz lives in actions)
- `lib/actions/{rooms,panels,candidates,users}.ts` — mutations, room-scoped, role-asserting
- `lib/data/queries.ts` — all reads, `roomId`-scoped: hub, board, panel, directory, admin
- `lib/logic/` — pure domain rules (unit-tested, no I/O)
- `components/{shell,board,panels,admin,ui}` — feature UI; `shell/header.tsx` is room-aware

## Patterns

- Pages await `params: Promise<...>` and call `await connection()` for dynamic data under PPR.
- Header exclusivity: `(app)/layout` renders no Header; the room layout renders Header(room); the hub renders its own — exactly one header per page.
- Identity: `user:<id>` is both the client PostHog distinctId (`components/identity-bridge.tsx`) and the server `trackDomainEvent` distinct id (`lib/analytics/posthog-server.ts`, props `actor_user`/`actor_role`), queued in `after()`.
