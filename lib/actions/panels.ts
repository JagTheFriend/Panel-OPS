"use server";

import { returnValidationErrors } from "next-safe-action";
import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import { prisma } from "@/lib/db";
import { ActionError, isUniqueViolation } from "@/lib/errors";
import { adminClient, authedClient } from "@/lib/safe-action";
import {
  createPanelSchema,
  panelIdSchema,
  removeMemberSchema,
  updatePanelSchema,
} from "@/lib/schemas";

export const createPanel = adminClient
  .inputSchema(createPanelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, description } = parsedInput;

    const existing = await prisma.panel.findUnique({ where: { name } });
    if (existing) {
      returnValidationErrors(createPanelSchema, {
        name: { _errors: ["A panel for this domain already exists."] },
      });
    }

    const panel = await prisma
      .$transaction(async (tx) => {
        const created = await tx.panel.create({
          data: {
            name,
            description: description || null,
            createdById: ctx.user.id,
          },
        });
        // Admins automatically join the panels they create.
        await tx.panelMembership.create({
          data: { panelId: created.id, userId: ctx.user.id },
        });
        return created;
      })
      .catch((error: unknown) => {
        if (!isUniqueViolation(error)) throw error;
        returnValidationErrors(createPanelSchema, {
          name: { _errors: ["A panel for this domain already exists."] },
        });
      });

    trackDomainEvent(ctx.user, "panel created", {
      panel_id: panel.id,
      panel_name: panel.name,
    });

    return { id: panel.id };
  });

export const updatePanel = adminClient
  .inputSchema(updatePanelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, name, description, isActive } = parsedInput;

    const panel = await prisma.panel.findUnique({ where: { id } });
    if (!panel) {
      throw new ActionError("NOT_FOUND", "Panel not found.");
    }

    if (panel.name !== name) {
      const clash = await prisma.panel.findUnique({ where: { name } });
      if (clash) {
        returnValidationErrors(updatePanelSchema, {
          name: { _errors: ["A panel for this domain already exists."] },
        });
      }
    }

    const updated = await prisma.panel.update({
      where: { id },
      data: { name, description: description || null, isActive },
    });

    trackDomainEvent(ctx.user, "panel updated", {
      panel_id: id,
      panel_name: updated.name,
      is_active: updated.isActive,
    });

    return { id: updated.id };
  });

export const deletePanel = adminClient
  .inputSchema(panelIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const panel = await prisma.panel.findUnique({
      where: { id: parsedInput.panelId },
    });
    if (!panel) {
      throw new ActionError("NOT_FOUND", "Panel not found.");
    }

    await prisma.panel.delete({ where: { id: panel.id } });

    trackDomainEvent(ctx.user, "panel deleted", {
      panel_id: panel.id,
      panel_name: panel.name,
    });

    return { id: panel.id };
  });

export const joinPanel = authedClient
  .inputSchema(panelIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const panel = await prisma.panel.findUnique({
      where: { id: parsedInput.panelId },
    });
    if (!panel || !panel.isActive) {
      throw new ActionError(
        "NOT_FOUND",
        "Panel not found or no longer active.",
      );
    }

    await prisma.panelMembership.upsert({
      where: { panelId_userId: { panelId: panel.id, userId: ctx.user.id } },
      update: {},
      create: { panelId: panel.id, userId: ctx.user.id },
    });

    trackDomainEvent(ctx.user, "panel joined", {
      panel_id: panel.id,
      panel_name: panel.name,
    });

    return { id: panel.id };
  });

export const leavePanel = authedClient
  .inputSchema(panelIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Scoped to the caller's own membership row, so leaving is idempotent and
    // safe for admins (leaving never removes anybody else).
    await prisma.panelMembership.deleteMany({
      where: { panelId: parsedInput.panelId, userId: ctx.user.id },
    });

    trackDomainEvent(ctx.user, "panel left", {
      panel_id: parsedInput.panelId,
    });

    return { id: parsedInput.panelId };
  });

export const removePanelMember = adminClient
  .inputSchema(removeMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const panel = await prisma.panel.findUnique({
      where: { id: parsedInput.panelId },
      select: { id: true, name: true },
    });
    if (!panel) {
      throw new ActionError("NOT_FOUND", "Panel not found.");
    }

    const removed = await prisma.panelMembership.deleteMany({
      where: { panelId: parsedInput.panelId, userId: parsedInput.userId },
    });

    if (removed.count === 0) {
      throw new ActionError("NOT_FOUND", "That member is not on this panel.");
    }

    const member = await prisma.user.findUnique({
      where: { id: parsedInput.userId },
      select: { rollNo: true },
    });

    trackDomainEvent(ctx.user, "panel member removed", {
      panel_id: panel.id,
      panel_name: panel.name,
      member_roll: member?.rollNo ?? "unknown",
    });

    return { id: parsedInput.userId };
  });
