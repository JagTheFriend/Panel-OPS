---
name: Conventions
description: Load when writing or reviewing TypeScript, server actions, components, or styles.
---

# Conventions

- **No new code comments** — code must read without them; explanation belongs in AGENTS.md/README, not inline.
- TypeScript strict; **Biome** lints and formats (`npx biome check --write` to auto-fix). No ESLint/Prettier. Import alias `@/`.
- **Server actions**: `"use server"` files in `lib/actions/`; input is a Zod schema from `lib/schemas.ts`; client is `authedClient` from `lib/safe-action.ts`; throw `ActionError(code, message)` for user-facing failures; errors surface through the `useAction` client hooks. `redirect()` inside actions is allowed (next-safe-action re-throws it).
- **State**: the server is the source of truth — mutations end in `router.refresh()`; no client caches, no polling, no WebSocket layer. Toasts use the existing `push({ title, tone })`.
- **UI**: reuse the kit in `components/ui` (Card, Button, Badge, EmptyState, ConfirmDialog, Toaster) and design tokens (`text-ink`, `border-line`, `bg-surface`, `shadow-card`) — no one-off inline styling. Feature UI lives in `components/{shell,board,panels,admin}`.
- **SEO**: authenticated routes are `noindex`; public pages need title/description/canonical metadata; keep `sitemap.ts`/`robots.ts` honest when routes change.
- **Next 16 specifics**: async `params` promises, `proxy.ts` (not `middleware.ts`), `cacheComponents` + `await connection()` for dynamic data under PPR — confirm details in `node_modules/next/dist/docs/` (see the block at the top of AGENTS.md).
