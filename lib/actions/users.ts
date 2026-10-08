"use server";

import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/errors";
import { adminClient } from "@/lib/safe-action";
import { deleteUserSchema, setUserRoleSchema } from "@/lib/schemas";

export const setUserRole = adminClient
  .inputSchema(setUserRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { userId, role } = parsedInput;

    if (userId === ctx.user.id && role !== "ADMIN") {
      throw new ActionError(
        "CONFLICT",
        "You cannot remove your own admin access.",
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ActionError("NOT_FOUND", "Member not found.");
    }
    if (user.role === role) return { id: userId };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    trackDomainEvent(ctx.user, "member role changed", {
      member_roll: updated.rollNo,
      new_role: role,
    });

    return { id: updated.id };
  });

export const deleteUser = adminClient
  .inputSchema(deleteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.userId === ctx.user.id) {
      throw new ActionError("CONFLICT", "You cannot delete your own account.");
    }

    const user = await prisma.user.findUnique({
      where: { id: parsedInput.userId },
    });
    if (!user) {
      throw new ActionError("NOT_FOUND", "Member not found.");
    }

    await prisma.user.delete({ where: { id: user.id } });

    trackDomainEvent(ctx.user, "member deleted", {
      member_roll: user.rollNo,
      member_role: user.role,
    });

    return { id: user.id };
  });
