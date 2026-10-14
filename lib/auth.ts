import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/errors";
import { getSession } from "@/lib/session";

export type Role = "ADMIN" | "USER";

export type CurrentUser = {
  id: string;
  rollNo: string;
  name: string | null;
  role: Role;
  panelIds: string[];
};

/**
 * Resolves the signed-in user for the current request.
 * Role is always read from the database so permission changes apply immediately.
 * Wrapped in React `cache()` so layout + page share a single query per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      rollNo: true,
      name: true,
      role: true,
      panels: { select: { panelId: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    rollNo: user.rollNo,
    name: user.name,
    role: user.role,
    panelIds: user.panels.map((m) => m.panelId),
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ActionError(
      "UNAUTHENTICATED",
      "Session expired. Please join again.",
    );
  }
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new ActionError("FORBIDDEN", "Administrator access required.");
  }
  return user;
}

/** Admins can manage any panel; users only panels they joined. */
export function canManagePanel(user: CurrentUser, panelId: string): boolean {
  if (user.role === "ADMIN") return true;
  return user.panelIds.includes(panelId);
}

export async function assertPanelAccess(
  user: CurrentUser,
  panelId: string,
): Promise<void> {
  if (!canManagePanel(user, panelId)) {
    throw new ActionError(
      "FORBIDDEN",
      "You must join this panel before managing it.",
    );
  }
}
