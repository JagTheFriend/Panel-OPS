---
name: Testing
description: Load when writing, debugging, or running unit tests or the Playwright e2e suite.
---

# Testing — Vitest + Playwright

## Unit (`npm test`)

`tests/unit/`: every schema from `lib/schemas.ts`, the pure rules in `lib/logic`, format helpers, a few UI primitives. New action schemas must land with tests — they are the input contract.

## E2E (`npm run test:e2e`)

Self-contained `webServer` (`e2e/serve.sh`): exports **5434** + `BETTER_AUTH_URL=http://localhost:3110`, wipes the test schema (`e2e/reset-db.ts`), `prisma migrate deploy`, seeds, `npm run build`, `next start -p 3110`. Never touches the dev server or dev DB. **One worker, fully serial — DB state persists across tests within a run.**

- Sessions: `signIn(page, TOKEN)` plants the **signed** cookie (`signedSessionCookie`, secret via `dotenv`); tokens live in `e2e/helpers.ts` (`dev-session-{admin,member,outsider,signout}`).
- Fixtures are the seeded demo room (`DEMO42`, PINs 7331/1234, member joined Web Development + Data Science) plus `uniqueToken()` names for anything created. Destructive tests (e2e sign-out) must use `SIGNOUT_SESSION` so shared tokens survive the run.
- `serve.sh` re-seeds from scratch every run — never rely on state from a previous run.
- Room URLs are `/rooms/<id>/{board,panels,admin/*}`; helpers `openRoom`/`openPanelBoard` wrap navigation.

## Locator lessons (learned here the hard way)

- `getByRole(name)` matches by **substring** — nav links need `exact: true` ("Board" also matches "Open board").
- After a client-side nav click, assert `await expect(page).toHaveURL(...)` **first** — an immediate heading assertion can evaluate against the *old* page and explode in strict mode.
- When a message renders both a toast and an inline copy, scope it: `getByRole("alert").filter({ hasText })`.
- On failure, read `test-results/<test>/error-context.md` — the aria snapshot shows exactly what the page contained — before guessing.

## Running subsets

`npx playwright test e2e/rooms.spec.ts`, `--grep "pattern"`, `--reporter=line`. Background runs should stream raw (a `| tail` pipe buffers everything until exit and hides progress).
