"use server";

import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import type { RoomRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionError, isUniqueViolation } from "@/lib/errors";
import { authedClient } from "@/lib/safe-action";
import { createRoomSchema, joinRoomSchema } from "@/lib/schemas";

const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const JOIN_WINDOW_MS = 5 * 60_000;
const JOIN_MAX_ATTEMPTS = 10;
const joinAttempts = new Map<string, { count: number; resetAt: number }>();

function pinsMatch(pin: string, expected: string) {
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function throttleJoinAttempt(key: string) {
  const now = Date.now();

  const entry = joinAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    joinAttempts.set(key, { count: 1, resetAt: now + JOIN_WINDOW_MS });
    return;
  }

  entry.count += 1;
  if (entry.count > JOIN_MAX_ATTEMPTS) {
    throw new ActionError(
      "FORBIDDEN",
      "Too many attempts. Try again in a few minutes.",
    );
  }

  if (joinAttempts.size > 1000) {
    for (const [k, v] of joinAttempts) {
      if (v.resetAt <= now) joinAttempts.delete(k);
    }
  }
}

function generateRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

export const createRoom = authedClient
  .inputSchema(createRoomSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, adminPin, normalPin } = parsedInput;

    let room = null;
    for (let attempt = 0; attempt < 5 && !room; attempt++) {
      const code = generateRoomCode();
      const clash = await prisma.room.findUnique({ where: { code } });
      if (clash) continue;

      room = await prisma
        .$transaction(async (tx) => {
          const created = await tx.room.create({
            data: {
              name,
              code,
              adminPin,
              normalPin,
              createdById: ctx.user.id,
            },
          });
          await tx.roomMembership.create({
            data: { roomId: created.id, userId: ctx.user.id, role: "ADMIN" },
          });
          return created;
        })
        .catch((error: unknown) => {
          if (isUniqueViolation(error)) return null;
          throw error;
        });
    }
    if (!room) {
      throw new ActionError(
        "CONFLICT",
        "Could not allocate a room code — please try again.",
      );
    }

    trackDomainEvent(ctx.user, "room created", {
      room_id: room.id,
      room_name: room.name,
    });

    redirect(`/rooms/${room.id}/board`);
  });

export const joinRoomByPin = authedClient
  .inputSchema(joinRoomSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { pin } = parsedInput;
    const code = parsedInput.code.toUpperCase();

    const requestHeaders = await headers();
    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      "unknown";
    await throttleJoinAttempt(`${ip}|${code}`);

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      throw new ActionError("NOT_FOUND", "No room with that code.");
    }

    const isAdminPin = pinsMatch(pin, room.adminPin);
    const isNormalPin = pinsMatch(pin, room.normalPin);
    if (!isAdminPin && !isNormalPin) {
      throw new ActionError("FORBIDDEN", "Incorrect PIN for this room.");
    }

    const role: RoomRole = isAdminPin ? "ADMIN" : "USER";
    await prisma.roomMembership.upsert({
      where: { roomId_userId: { roomId: room.id, userId: ctx.user.id } },
      update: { role },
      create: { roomId: room.id, userId: ctx.user.id, role },
    });

    trackDomainEvent(ctx.user, "room joined", {
      room_id: room.id,
      room_name: room.name,
      joined_role: role,
    });

    redirect(`/rooms/${room.id}/board`);
  });
