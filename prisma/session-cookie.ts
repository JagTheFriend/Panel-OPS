import { createHmac } from "node:crypto";

/**
 * better-auth stores the session cookie as `token.signature` (HMAC-SHA256 of
 * the token keyed with BETTER_AUTH_SECRET, base64) and refuses unsigned
 * values. Seeded dev/e2e sessions must plant the signed form.
 */
export function signedSessionCookie(token: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET is not set — cannot sign session cookies",
    );
  }
  const signature = createHmac("sha256", secret).update(token).digest("base64");
  return encodeURIComponent(`${token}.${signature}`);
}
