import { NextResponse } from "next/server";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

/**
 * Clears a better-auth session cookie that no longer resolves to an account
 * and bounces to /join. Without this, a stale cookie loops forever: the layout
 * redirects here, the proxy sees a cookie and sends the browser back into the
 * app.
 */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/join", request.url));
  for (const name of SESSION_COOKIES) {
    response.cookies.set(name, "", { expires: new Date(0), path: "/" });
  }
  return response;
}
