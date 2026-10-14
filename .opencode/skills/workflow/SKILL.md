---
name: Workflow
description: Load when running checks or builds, committing work, or following oc-panelist tooling and repo conventions.
---

# Workflow — commands, gates, commits

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm start` | Next on the default port (3000, auto-increments when busy) |
| `npm run build` / `vercel-build` | build; Vercel adds `prisma migrate deploy` |
| `npm run lint` / `format` | Biome check / write (`npx biome check --write` auto-fixes) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit + component |
| `npm run test:e2e` | Playwright — self-contained (see the `testing` skill) |
| `npm run db:up` / `db:migrate` / `db:seed` / `db:reset` | docker + Prisma workflows |

## Gate order before claiming done

1. `npx biome check`
2. `npx tsc --noEmit` — ignore stale `.next/**` route-validator noise; `rm -rf .next && npm run build` regenerates it
3. `npx vitest run`
4. `npm run build`
5. `npm run test:e2e`

## Git

- Branch `prod-config`; conventional prefixes `feat:`/`fix:`/`test:`/`docs:`/`chore:`.
- Commit each finished batch; keep the tree clean — including the `next dev`-managed AGENTS.md block (commit it, don't strip it).
- `.env` is gitignored; `.env.example` is the public contract — update both together, never commit secrets.
- Scratch scripts go in `.scratch/*.ts` (created and deleted within the task).

## Gotchas

- `npm run build` clobbers the `.next` of any running server — rebuild before serving again, and never build while `next dev` is using the same `.next`.
- Ports: dev = default Next port, e2e = 3110, docker = 5433 (dev DB) / 5434 (test DB).
- Prisma CLI commands run against `DATABASE_URL_UNPOOLED` (see the `database` skill) — exports in the shell win over `.env`.
