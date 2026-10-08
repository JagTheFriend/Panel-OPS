#!/usr/bin/env bash
# Playwright webServer bootstrap.
#
#   1. reset + seed the isolated TEST database (port 5434)
#   2. build the production bundle
#   3. serve it on port 3110
#
# Everything is pointed at 5434 via the environment, so the dev database on
# 5433 (and the server already running on 3100) is never touched. The server
# still reads SESSION_SECRET / ROOM_PIN / ADMIN_PIN from .env.
#
# The reset is done as "drop schema + migrate deploy + db seed" rather than
# `prisma migrate reset` because Prisma refuses to run that command when it
# detects an AI agent; the resulting baseline is identical.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="postgresql://ocpanelist:ocpanelist@localhost:5434/ocpanelist_test?schema=public"
export DATABASE_URL_UNPOOLED="$DATABASE_URL"

echo "[e2e] resetting + seeding test database on 5434"
npx tsx e2e/reset-db.ts
npx prisma migrate deploy
npx prisma db seed

echo "[e2e] building production bundle"
npm run build

echo "[e2e] starting server on http://localhost:3110"
exec ./node_modules/.bin/next start -p 3110
