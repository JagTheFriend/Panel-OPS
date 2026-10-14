---
name: Database
description: Load when touching the Prisma schema, migrations, seeding, or any of oc-panelist's three Postgres databases.
---

# Database — three Postgres instances

| DB | Connection | Used by |
| --- | --- | --- |
| Neon (prod/dev) | `DATABASE_URL` in `.env` | the running app; seeded with `npm run db:seed` |
| Docker `:5433` | `ocpanelist` | optional local parity (`npm run db:up`) |
| Docker `:5434` | `ocpanelist_test` | e2e only — reset + migrate + seeded by `e2e/serve.sh` every run |

## Key facts

- **One squashed migration**: `prisma/migrations/0_init/migration.sql`. The `_prisma_migrations` row on Neon is booked manually with the **SHA-256** checksum of the file (Prisma's format — an md5 checksum makes Vercel's `vercel-build` → `prisma migrate deploy` fail).
- **`prisma.config.ts` prefers `DATABASE_URL_UNPOOLED`** over `DATABASE_URL` for the CLI. Consequence: Prisma CLI against Neon fails with **P1001**, while the same URL works fine through the `pg`/Prisma-JS client.
- **Schema changes on Neon therefore never go through the CLI** — use a `.scratch/db-op.ts` script with `pg` (pattern: wipe schema → run `0_init` → book `_prisma_migrations`), then delete the script.
- Shell-exported `DATABASE_URL`/`DATABASE_URL_UNPOOLED` always win (dotenv never overrides) — that's how e2e pins 5434.
- Test DB is wiped/reset by `e2e/reset-db.ts` (raw `pg` DROP/CREATE), then `prisma migrate deploy` + seed.

## Seed (`prisma/seed.ts`, idempotent)

- Room **Demo Room** — code `DEMO42`, admin PIN `7331`, normal PIN `1234`.
- Users `admin@` / `member@` / `outsider@panelops.dev` (outsider has **no** membership — for join-flow tests). The member joins only **Web Development + Data Science**; the admin joins all four domains; sample candidates queue on Web Development when empty; stale panels outside the domain list are deactivated.
- Session rows store raw tokens `dev-session-{admin,member,outsider,signout}`; `signout` is disposable (e2e sign-out deletes it). **The cookie value must be signed** — the seed prints ready-to-paste signed values (see the `auth-rooms` skill).
