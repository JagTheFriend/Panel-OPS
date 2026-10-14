import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic auth check (Next 16 `proxy.ts`, formerly middleware).
 *
 * Reads only the better-auth session cookie — no database access — so it is
 * safe to run on every request/prefetch. Guarantees a real HTTP 307 for
 * anonymous document loads before any HTML is flushed; the room layout
 * re-validates against the database as defence in depth.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSessionCookie(request);

  if (pathname === "/join") {
    if (session) return NextResponse.redirect(new URL("/rooms", request.url));
    return NextResponse.next();
  }

  if (pathname === "/rooms" || pathname.startsWith("/rooms/")) {
    if (!session) {
      return NextResponse.redirect(new URL("/join", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rooms/:path*", "/join"],
};
