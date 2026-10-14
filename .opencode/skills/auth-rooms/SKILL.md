---
name: Auth & rooms
description: Load when working on sign-in, sessions or cookies, room roles and PINs, membership, or authorization guards.
---

# Auth & rooms — better-auth + the room model

## Sign-in

- better-auth 1.7, **Google only** (no password fallback). Server: `lib/auth.ts` — `betterAuth` + `prismaAdapter(prisma, { provider: "postgresql" })` + `nextCookies()`; browser: `lib/auth-client.ts` (`authClient`); handler: `app/api/auth/[...all]/route.ts` (`toNextJsHandler`).
- Env: `BETTER_AUTH_SECRET` (64-hex), `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`. Empty Google creds = the sign-in button surfaces an error (alert) — local dev and e2e use seeded sessions instead.
- Sessions are DB rows (`Session` + `User` + `Account`); cookie name `better-auth.session_token`.

## ⚠ Session cookies are SIGNED

better-auth writes `encodeURIComponent(token + "." + base64(HMAC-SHA256(BETTER_AUTH_SECRET, token)))` and **rejects unsigned values** — a raw `dev-session-admin` cookie yields `get-session: null`. Any planted cookie must go through `prisma/session-cookie.ts#signedSessionCookie` (the seed prints ready-to-paste values; e2e `signIn` signs automatically). Sign-out **deletes** the session row — destructive tests must use the disposable `dev-session-signout` token.

## Guards & redirects

- `proxy.ts` gates on cookie **presence** only (no DB): `/rooms*` without a cookie → 307 `/join`; `/join` with a cookie → 307 `/rooms`.
- Real checks: `(app)/layout` (`getCurrentUser`, failure → `/api/session/clear` which clears the cookie, preventing loops) and the room layout (membership → `/rooms`).
- Role asserts live in guards (`requireRoomAdminContext`, `requirePanelStaffContext`, `requirePanelAdminContext`, … from `lib/auth.ts`) and are re-run **inside every action** — forged requests fail server-side; there is no separate admin client.

## Room model (Prisma)

- `Room { code @unique, adminPin, normalPin, createdById }` · `RoomMembership @@unique([roomId, userId])` with `RoomRole ADMIN|USER` · `Panel` scoped `@@unique([roomId, name])`. Roles are **per room** — there is no global role.
- Pins: plaintext, 4–12 chars, must differ. Creator = ADMIN. Join by code + PIN — the PIN used decides the role; rejoining upserts the role. Join attempts throttled per `ip|code` (10 / 5 min, constant-time compare).
- USER sees only joined panels on the board plus the full directory (to join); ADMIN sees every panel and gets `/rooms/[roomId]/admin/*`.
