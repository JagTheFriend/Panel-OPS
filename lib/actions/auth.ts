"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { returnValidationErrors } from "next-safe-action";
import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import type { Role } from "@/lib/auth";
import { readDomainConfig } from "@/lib/config";
import { prisma } from "@/lib/db";
import { ActionError, isUniqueViolation } from "@/lib/errors";
import { actionClient } from "@/lib/safe-action";
import { joinRoomSchema } from "@/lib/schemas";
import { destroySession, getSession } from "@/lib/session";

const PIN_WINDOW_MS = 5 * 60_000;
const PIN_MAX_ATTEMPTS = 10;
const pinAttempts = new Map<string, { count: number; resetAt: number }>();

function pinsMatch(pin: string, expected: string | undefined) {
  if (!expected) return false;
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function throttlePinAttempt(key: string) {
  const now = Date.now();

  if (pinAttempts.size > 500) {
    for (const [staleKey, entry] of pinAttempts) {
      if (entry.resetAt <= now) pinAttempts.delete(staleKey);
    }
  }

  const entry = pinAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    pinAttempts.set(key, { count: 1, resetAt: now + PIN_WINDOW_MS });
    return;
  }

  entry.count += 1;
  if (entry.count > PIN_MAX_ATTEMPTS) {
    throw new ActionError(
      "RATE_LIMITED",
      "Too many PIN attempts. Wait a few minutes and try again.",
    );
  }
}

export const joinRoom = actionClient
  .inputSchema(joinRoomSchema)
  .action(async ({ parsedInput }) => {
    const { rollNo, pin, name, panelIds } = parsedInput;

    const requestHeaders = await headers();
    const clientIp =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    await throttlePinAttempt(`${clientIp}|${rollNo}`);

    const adminPin = process.env.ADMIN_PIN;
    const roomPin = readDomainConfig().ROOM_PIN ?? process.env.ROOM_PIN;
    const isAdminPin = pinsMatch(pin, adminPin);
    const isRoomPin = pinsMatch(pin, roomPin);

    if (!isAdminPin && !isRoomPin) {
      returnValidationErrors(joinRoomSchema, {
        pin: { _errors: ["Incorrect PIN. Check with the room coordinator."] },
      });
    }
    pinAttempts.delete(`${clientIp}|${rollNo}`);

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

    if (panelIds.length > 0 && panels.length === 0) {
      returnValidationErrors(joinRoomSchema, {
        panelIds: { _errors: ["Those domains are no longer open"] },
      });
    }

    let user = await prisma.user
      .upsert({
        where: { rollNo },
        create: { rollNo, name, role: desiredRole },
        update: {},
      })
      .catch(async (error: unknown) => {
        // Concurrent check-in with the same roll: the create raced, row exists.
        if (!isUniqueViolation(error)) throw error;
        return prisma.user.findUniqueOrThrow({ where: { rollNo } });
      });

    const patch: { role?: Role; name?: string } = {};
    if (isAdminPin && user.role !== "ADMIN") patch.role = "ADMIN";
    if (!user.name && name) patch.name = name;
    if (Object.keys(patch).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: patch,
      });
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
