"use server";

import { returnValidationErrors } from "next-safe-action";
import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import { requireRoomAdminContext, requireRoomContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/errors";
import { authedClient } from "@/lib/safe-action";
import {
  createPanelSchema,
  panelRefSchema,
  removePanelMemberSchema,
  updatePanelSchema,
} from "@/lib/schemas";

async function findRoomPanel(roomId: string, panelId: string) {
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    select: { id: true, roomId: true, name: true },
  });
  if (!panel || panel.roomId !== roomId) {
    throw new ActionError("NOT_FOUND", "Panel not found.");
  }
  return panel;
}

export const createPanel = authedClient
  .inputSchema(createPanelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { roomId, name, description } = parsedInput;
    const roomCtx = await requireRoomAdminContext(roomId, ctx.user.id);

    const existing = await prisma.panel.findUnique({
      where: { roomId_name: { roomId, name } },
    });
    if (existing) {
      returnValidationErrors(createPanelSchema, {
        name: {
          _errors: ["A panel with this name already exists in this room."],
        },
      });
    }

    const panel = await prisma.$transaction(async (tx) => {
      const created = await tx.panel.create({
        data: {
          roomId,
          name,
          description: description || null,
          createdById: ctx.user.id,
        },
      });
      await tx.panelMembership.create({
        data: { panelId: created.id, userId: ctx.user.id },
      });
      return created;
    });

    trackDomainEvent({ id: ctx.user.id, role: roomCtx.role }, "panel created", {
      room_id: roomId,
      panel_id: panel.id,
      panel_name: panel.name,
    });

    return { id: panel.id };
  });

export const updatePanel = authedClient
  .inputSchema(updatePanelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { roomId, id, name, description, isActive } = parsedInput;
    const roomCtx = await requireRoomAdminContext(roomId, ctx.user.id);
    await findRoomPanel(roomId, id);

    const clash = await prisma.panel.findUnique({
      where: { roomId_name: { roomId, name } },
    });
    if (clash && clash.id !== id) {
      returnValidationErrors(updatePanelSchema, {
        name: {
          _errors: ["A panel with this name already exists in this room."],
        },
      });
    }

    const updated = await prisma.panel.update({
      where: { id },
      data: { name, description: description || null, isActive },
    });

    trackDomainEvent({ id: ctx.user.id, role: roomCtx.role }, "panel updated", {
      room_id: roomId,
      panel_id: id,
      panel_name: updated.name,
      is_active: updated.isActive,
    });

    return { id: updated.id };
  });

export const deletePanel = authedClient
  .inputSchema(panelRefSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { roomId, panelId } = parsedInput;
    const roomCtx = await requireRoomAdminContext(roomId, ctx.user.id);
    const panel = await findRoomPanel(roomId, panelId);

    await prisma.panel.delete({ where: { id: panel.id } });

    trackDomainEvent({ id: ctx.user.id, role: roomCtx.role }, "panel deleted", {
      room_id: roomId,
      panel_id: panel.id,
      panel_name: panel.name,
    });

    return { id: panel.id };
  });

export const joinPanel = authedClient
  .inputSchema(panelRefSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { roomId, panelId } = parsedInput;
    await requireRoomContext(roomId, ctx.user.id);
    const panel = await prisma.panel.findUnique({
      where: { id: panelId },
      select: { id: true, roomId: true, name: true, isActive: true },
    });
    if (!panel || panel.roomId !== roomId || !panel.isActive) {
      throw new ActionError(
        "NOT_FOUND",
        "Panel not found or no longer active.",
      );
    }

    await prisma.panelMembership.upsert({
      where: { panelId_userId: { panelId, userId: ctx.user.id } },
      update: {},
      create: { panelId, userId: ctx.user.id },
    });

    trackDomainEvent(ctx.user, "panel joined", {
      room_id: roomId,
      panel_id: panelId,
      panel_name: panel.name,
    });

    return { id: panelId };
  });

export const leavePanel = authedClient
  .inputSchema(panelRefSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { roomId, panelId } = parsedInput;
    await requireRoomContext(roomId, ctx.user.id);
    await findRoomPanel(roomId, panelId);

    // Scoped to the caller's own membership row, so leaving is idempotent and
    // safe for admins (leaving never removes anybody else).
    await prisma.panelMembership.deleteMany({
      where: { panelId, userId: ctx.user.id },
    });

    trackDomainEvent(ctx.user, "panel left", {
      room_id: roomId,
      panel_id: panelId,
    });

    return { id: panelId };
  });

export const removePanelMember = authedClient
  .inputSchema(removePanelMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const panel = await prisma.panel.findUnique({
      where: { id: parsedInput.panelId },
      select: { id: true, roomId: true, name: true },
    });
    if (!panel) {
      throw new ActionError("NOT_FOUND", "Panel not found.");
    }
    const roomCtx = await requireRoomAdminContext(panel.roomId, ctx.user.id);

    const removed = await prisma.panelMembership.deleteMany({
      where: { panelId: panel.id, userId: parsedInput.userId },
    });
    if (removed.count === 0) {
      throw new ActionError("NOT_FOUND", "That member is not on this panel.");
    }

    const member = await prisma.user.findUnique({
      where: { id: parsedInput.userId },
      select: { id: true, name: true, email: true },
    });

    trackDomainEvent(
      { id: ctx.user.id, role: roomCtx.role },
      "panel member removed",
      {
        room_id: panel.roomId,
        panel_id: panel.id,
        panel_name: panel.name,
        member_user: member?.id ?? parsedInput.userId,
        member_email: member?.email ?? null,
      },
    );

    return { id: parsedInput.userId };
  });
