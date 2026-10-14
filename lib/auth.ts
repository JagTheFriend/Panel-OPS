import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/errors";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [nextCookies()],
});

export type RoomRole = "ADMIN" | "USER";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type RoomContext = {
  room: { id: string; name: string; code: string };
  role: RoomRole;
};

export type PanelContext = RoomContext & {
  panel: { id: string; roomId: string; name: string; isActive: boolean };
};

/**
 * Resolves the signed-in user for the current request via better-auth.
 * Wrapped in React `cache()` so layout + page share a single lookup per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  };
});

async function loadRoomContext(
  roomId: string,
  userId: string,
): Promise<RoomContext | null> {
  const membership = await prisma.roomMembership.findUnique({
    where: { roomId_userId: { roomId, userId } },
    select: {
      role: true,
      room: { select: { id: true, name: true, code: true } },
    },
  });
  if (!membership) return null;
  return { room: membership.room, role: membership.role };
}

export async function getRoomContext(
  roomId: string,
  userId: string,
): Promise<RoomContext | null> {
  return loadRoomContext(roomId, userId);
}

export async function requireRoomContext(
  roomId: string,
  userId: string,
): Promise<RoomContext> {
  const ctx = await loadRoomContext(roomId, userId);
  if (!ctx) throw new ActionError("NOT_FOUND", "Room not found.");
  return ctx;
}

export async function requireRoomAdminContext(
  roomId: string,
  userId: string,
): Promise<RoomContext> {
  const ctx = await requireRoomContext(roomId, userId);
  if (ctx.role !== "ADMIN") {
    throw new ActionError("FORBIDDEN", "Room admin access required.");
  }
  return ctx;
}

async function loadPanelContext(
  panelId: string,
  userId: string,
): Promise<PanelContext | null> {
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    select: {
      id: true,
      roomId: true,
      name: true,
      isActive: true,
    },
  });
  if (!panel) return null;

  const roomCtx = await loadRoomContext(panel.roomId, userId);
  if (!roomCtx) return null;

  return { ...roomCtx, panel };
}

/** Any member of the panel's room (admins see all panels, members only their picks). */
export async function requirePanelContext(
  panelId: string,
  userId: string,
): Promise<PanelContext> {
  const ctx = await loadPanelContext(panelId, userId);
  if (!ctx) throw new ActionError("NOT_FOUND", "Panel not found.");
  return ctx;
}

/** Panel-level operations for staff: room admins, or members of this panel. */
export async function requirePanelStaffContext(
  panelId: string,
  userId: string,
): Promise<PanelContext> {
  const ctx = await requirePanelContext(panelId, userId);
  if (ctx.role === "ADMIN") return ctx;

  const membership = await prisma.panelMembership.findUnique({
    where: { panelId_userId: { panelId, userId } },
    select: { id: true },
  });
  if (!membership) {
    throw new ActionError("FORBIDDEN", "You have not joined this panel.");
  }
  return ctx;
}

export async function requirePanelAdminContext(
  panelId: string,
  userId: string,
): Promise<PanelContext> {
  const ctx = await requirePanelContext(panelId, userId);
  if (ctx.role !== "ADMIN") {
    throw new ActionError("FORBIDDEN", "Room admin access required.");
  }
  return ctx;
}
