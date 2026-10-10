"use server";

import { redirect } from "next/navigation";
import { returnValidationErrors } from "next-safe-action";
import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import type { Role } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { actionClient } from "@/lib/safe-action";
import { joinRoomSchema } from "@/lib/schemas";
import { destroySession, getSession } from "@/lib/session";

export const joinRoom = actionClient
  .inputSchema(joinRoomSchema)
  .action(async ({ parsedInput }) => {
    const { rollNo, pin, name, panelIds } = parsedInput;

    const adminPin = process.env.ADMIN_PIN;
    const roomPin = process.env.ROOM_PIN;
    const isAdminPin = Boolean(adminPin) && pin === adminPin;
    const isRoomPin = Boolean(roomPin) && pin === roomPin;

    if (!isAdminPin && !isRoomPin) {
      returnValidationErrors(joinRoomSchema, {
        pin: { _errors: ["Incorrect PIN. Check with the room coordinator."] },
      });
    }

    const desiredRole: Role = isAdminPin ? "ADMIN" : "USER";

    // Picking domains is required whenever any panel is open; only when the
    // room is completely empty can somebody check in without a selection.
    if (panelIds.length === 0) {
      const activePanels = await prisma.panel.count({
        where: { isActive: true },
      });
      if (activePanels > 0) {
        returnValidationErrors(joinRoomSchema, {
          panelIds: { _errors: ["Pick at least one domain"] },
        });
      }
    }

    const panels = panelIds.length
      ? await prisma.panel.findMany({
          where: { id: { in: panelIds }, isActive: true },
          select: { id: true },
        })
      : [];

    let user = await prisma.user.findUnique({ where: { rollNo } });
    if (!user) {
      user = await prisma.user.create({
        data: { rollNo, name, role: desiredRole },
      });
    } else {
      const patch: { role?: Role; name?: string } = {};
      if (isAdminPin && user.role !== "ADMIN") patch.role = "ADMIN";
      if (!user.name && name) patch.name = name;
      if (Object.keys(patch).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: patch,
        });
      }
    }

    if (panels.length > 0) {
      await prisma.panelMembership.createMany({
        data: panels.map((panel) => ({ panelId: panel.id, userId: user.id })),
        skipDuplicates: true,
      });
    }

    const session = await getSession();
    session.userId = user.id;
    session.rollNo = user.rollNo;
    await session.save();

    trackDomainEvent(user, "room joined", {
      method: isAdminPin ? "admin_pin" : "room_pin",
      panels_selected: panels.length,
    });

    redirect("/board");
  });

export const logout = actionClient.action(async () => {
  const session = await getSession();
  const rollNo = session.rollNo;
  if (rollNo) {
    trackDomainEvent({ rollNo, role: "USER" }, "room left", {});
  }
  await destroySession();
  redirect("/join");
});
