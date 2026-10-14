import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const sessionCookieName = "better-auth.session_token";
