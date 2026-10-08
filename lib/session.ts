import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  rollNo?: string;
};

export const sessionCookieName = "oc_panel_session";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: sessionCookieName,
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

function assertSessionSecret() {
  const password = process.env.SESSION_SECRET ?? "";
  if (password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters. See .env.example.",
    );
  }
}

export async function getSession() {
  assertSessionSecret();
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
