# oc-panelist — PanelOps

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Campus-recruitment panel & interview-queue tracker. Next.js 16 (App Router, PPR/`cacheComponents`), better-auth (Google-only sign-in), Prisma 7 + Postgres, Tailwind v4, next-safe-action, PostHog. Dev server runs on the default Next port (3000, auto-increments when busy); e2e serves on 3110.

## Project skills

Deep guidance lives in [`.opencode/skills/`](.opencode/skills/) — only the descriptions below are always in context. Load one with the `skill` tool, or mention `@<id>` in a prompt, when the task matches:

| Skill | Load when the task involves |
| --- | --- |
| [`architecture`](.opencode/skills/architecture/SKILL.md) | request flow, routes, server actions, data queries, UI structure |
| [`workflow`](.opencode/skills/workflow/SKILL.md) | running checks or builds, committing, tooling and repo conventions |
| [`database`](.opencode/skills/database/SKILL.md) | Prisma schema, migrations, seeding, or the three Postgres databases |
| [`auth-rooms`](.opencode/skills/auth-rooms/SKILL.md) | sign-in, sessions/cookies, room roles & PINs, authorization guards |
| [`testing`](.opencode/skills/testing/SKILL.md) | unit tests, the Playwright e2e suite, fixtures, locators |
| [`conventions`](.opencode/skills/conventions/SKILL.md) | writing or reviewing TypeScript, server actions, components, styles |

## Always-on rules

- No new code comments — the code must read without them.
- Keep it simple: the smallest coherent change, no speculative features or gold-plating.
- Never leave a server running: after work, find its PID (`ss -ltnp | grep :<port>`) and kill it. Never `pkill -f` — it kills unrelated sessions; a Docker-owned `next-server` may be foreign, don't touch it.
- Commit each finished batch (conventional prefixes `feat:`/`fix:`/`test:`/`docs:`/`chore:`); keep `README.md` and `.env.example` in sync with any behavior or env change.
- Before claiming done, run every gate: Biome, `tsc --noEmit`, unit tests, `npm run build`, e2e.
- Scratch/helper scripts live in `.scratch/` inside the project and are deleted before committing.
