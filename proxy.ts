import { getIronSession } from "iron-session";
import { type NextRequest, NextResponse } from "next/server";
import { type SessionData, sessionOptions } from "@/lib/session";

const PROTECTED_PREFIXES = ["/board", "/panels", "/admin"];

/**
 * Optimistic auth check (Next 16 `proxy.ts`, formerly middleware).
 *
 * Reads only the encrypted session cookie — no database access — so it is safe
 * to run on every request/prefetch. Guarantees a real HTTP 307 for anonymous
 * document loads before any HTML is flushed; the layout re-validates against
 * the database as defence in depth.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isJoin = pathname === "/join";

  if (!isProtected && !isJoin) {
    return NextResponse.next();
  }

  let authed = false;
  try {
    const session = await getIronSession<SessionData>(
      request,
      new NextResponse(),
      sessionOptions,
    );
    authed = Boolean(session.userId);
  } catch {
    authed = false;
  }

  if (isProtected && !authed) {
    return NextResponse.redirect(new URL("/join", request.url));
  }

  if (isJoin && authed) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/board/:path*", "/panels/:path*", "/admin/:path*", "/join"],
};
