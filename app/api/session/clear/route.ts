import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { destroySession, getSession } from "@/lib/session";

/**
 * Clears a session cookie that no longer resolves to an account and bounces
 * to /join. Without this, a deleted account with a live cookie loops forever:
 * the layout redirects to /join, the proxy sees a valid cookie and sends the
 * browser back to /board.
 */
export async function GET(request: Request) {
  const session = await getSession();
  const user = session.userId
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true },
      })
    : null;

  // Account still exists (transient failure) — keep the session.
  if (user) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  await destroySession();
  return NextResponse.redirect(new URL("/join", request.url));
}
