"use server";

import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import { requirePanelAdminContext, requirePanelStaffContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionError, isUniqueViolation } from "@/lib/errors";
import {
  applyStatusTransition,
  type CandidateStatus,
} from "@/lib/logic/candidates";
import { authedClient } from "@/lib/safe-action";
import {
  addCandidateSchema,
  candidateStatusSchema,
  removeCandidateSchema,
  reorderCandidatesSchema,
  updateCandidateSchema,
} from "@/lib/schemas";

function orderByPosition() {
  return [{ position: "asc" as const }, { joinedAt: "asc" as const }];
}

export const addCandidate = authedClient
  .inputSchema(addCandidateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { panelId, rollNo, name } = parsedInput;

    const panelCtx = await requirePanelAdminContext(panelId, ctx.user.id);
    if (!panelCtx.panel.isActive) {
      throw new ActionError(
        "NOT_FOUND",
        "Panel not found or no longer active.",
      );
    }

    const duplicate = await prisma.candidate.findUnique({
      where: { panelId_rollNo: { panelId, rollNo } },
    });
    if (duplicate) {
      throw new ActionError(
        "CONFLICT",
        `${rollNo} is already in this panel's queue.`,
      );
    }

    const last = await prisma.candidate.findFirst({
      where: { panelId, status: "WAITING" },
      orderBy: orderByPosition(),
      select: { position: true },
    });

    const candidate = await prisma.candidate
      .create({
        data: {
          panelId,
          rollNo,
          name: name || null,
          status: "WAITING",
          position: (last?.position ?? -1) + 1,
          addedById: ctx.user.id,
        },
      })
      .catch((error: unknown) => {
        if (!isUniqueViolation(error)) throw error;
        throw new ActionError(
          "CONFLICT",
          `${rollNo} is already in this panel's queue.`,
        );
      });

    trackDomainEvent(
      { id: ctx.user.id, role: panelCtx.role },
      "candidate added",
      {
        room_id: panelCtx.room.id,
        panel_id: panelId,
        panel_name: panelCtx.panel.name,
        candidate_roll: rollNo,
      },
    );

    return { id: candidate.id };
  });

/**
 * Moves a candidate between columns (with optional insert index) and keeps
 * kanban ordering consistent in one transaction. The panel's candidates are
 * locked FOR UPDATE first so concurrent drags serialise instead of writing
 * stale ordering, and only rows whose position actually changes are updated.
 */
async function moveCandidate(
  candidateId: string,
  toStatus: CandidateStatus,
  index?: number,
) {
  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<
        {
          id: string;
          status: CandidateStatus;
          position: number;
          joinedAt: Date;
          startedAt: Date | null;
          completedAt: Date | null;
        }[]
      >`
        SELECT c.id, c.status, c.position, c."joinedAt", c."startedAt", c."completedAt"
        FROM "Candidate" c
        WHERE c."panelId" = (
          SELECT p."panelId" FROM "Candidate" p WHERE p.id = ${candidateId}
        )
        FOR UPDATE
      `;

      const candidate = rows.find((row) => row.id === candidateId);
      if (!candidate) {
        throw new ActionError("NOT_FOUND", "Candidate not found.");
      }

      const fromStatus = candidate.status;
      const transition = applyStatusTransition(candidate, toStatus);
      if (!transition.ok) {
        throw new ActionError("CONFLICT", transition.error);
      }

      const columnIds = (status: CandidateStatus) =>
        rows
          .filter((row) => row.status === status && row.id !== candidate.id)
          .sort(
            (a, b) =>
              a.position - b.position ||
              a.joinedAt.getTime() - b.joinedAt.getTime(),
          )
          .map((row) => row.id);

      const fromIds = columnIds(fromStatus);
      const toIds = columnIds(toStatus);
      const insertAt = Math.max(
        0,
        Math.min(index ?? toIds.length, toIds.length),
      );
      const finalTo = [
        ...toIds.slice(0, insertAt),
        candidate.id,
        ...toIds.slice(insertAt),
      ];

      const positions = new Map(rows.map((row) => [row.id, row.position]));

      await tx.candidate.update({
        where: { id: candidate.id },
        data: {
          status: transition.value.status,
          startedAt: transition.value.startedAt,
          completedAt: transition.value.completedAt,
          position: insertAt,
        },
      });

      const renumber = async (ids: string[]) => {
        for (const [i, id] of ids.entries()) {
          if (positions.get(id) === i) continue;
          await tx.candidate.update({ where: { id }, data: { position: i } });
        }
      };

      if (fromStatus !== toStatus) {
        await renumber(fromIds);
      }
      await renumber(finalTo.filter((id) => id !== candidate.id));

      return {
        candidate: { ...candidate, ...transition.value },
        toStatus,
        fromStatus,
      };
    },
    { timeout: 10_000 },
  );
}

export const setCandidateStatus = authedClient
  .inputSchema(candidateStatusSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, status, index } = parsedInput;

    const existing = await prisma.candidate.findUnique({
      where: { id },
      select: { panelId: true, rollNo: true },
    });
    if (!existing) {
      throw new ActionError("NOT_FOUND", "Candidate not found.");
    }
    const panelCtx = await requirePanelStaffContext(
      existing.panelId,
      ctx.user.id,
    );

    const result = await moveCandidate(id, status, index);

    if (result.fromStatus !== result.toStatus) {
      const eventName =
        status === "IN_INTERVIEW"
          ? "interview started"
          : status === "DONE"
            ? "interview marked done"
            : "interview reopened";

      const properties: Record<string, string | number | boolean | null> = {
        room_id: panelCtx.room.id,
        panel_id: existing.panelId,
        candidate_roll: existing.rollNo,
        from_status: result.fromStatus,
        to_status: status,
      };

      if (status === "DONE" && result.candidate.startedAt) {
        properties.interview_duration_ms =
          Date.now() - result.candidate.startedAt.getTime();
      }
      if (status === "IN_INTERVIEW" && result.candidate.joinedAt) {
        properties.queue_wait_ms =
          Date.now() - result.candidate.joinedAt.getTime();
      }

      trackDomainEvent(
        { id: ctx.user.id, role: panelCtx.role },
        eventName,
        properties,
      );
    }

    return { id, status };
  });

export const reorderCandidates = authedClient
  .inputSchema(reorderCandidatesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { panelId, orderedIds } = parsedInput;
    await requirePanelStaffContext(panelId, ctx.user.id);

    const candidates = await prisma.candidate.findMany({
      where: { panelId, id: { in: orderedIds } },
      select: { id: true, status: true },
    });
    if (
      candidates.length !== orderedIds.length ||
      new Set(candidates.map((c) => c.status)).size !== 1
    ) {
      throw new ActionError("CONFLICT", "Queue changed — please refresh.");
    }

    await prisma.$transaction(
      orderedIds.map((id, i) =>
        prisma.candidate.update({ where: { id }, data: { position: i } }),
      ),
    );

    return { count: orderedIds.length };
  });

export const updateCandidate = authedClient
  .inputSchema(updateCandidateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, name } = parsedInput;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { panelId: true, rollNo: true },
    });
    if (!candidate) {
      throw new ActionError("NOT_FOUND", "Candidate not found.");
    }
    const panelCtx = await requirePanelStaffContext(
      candidate.panelId,
      ctx.user.id,
    );

    await prisma.candidate.update({ where: { id }, data: { name } });

    trackDomainEvent(
      { id: ctx.user.id, role: panelCtx.role },
      "candidate updated",
      {
        room_id: panelCtx.room.id,
        panel_id: candidate.panelId,
        candidate_roll: candidate.rollNo,
      },
    );

    return { id };
  });

export const removeCandidate = authedClient
  .inputSchema(removeCandidateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const candidate = await prisma.candidate.findUnique({
      where: { id: parsedInput.id },
    });
    if (!candidate) {
      throw new ActionError("NOT_FOUND", "Candidate not found.");
    }
    const panelCtx = await requirePanelAdminContext(
      candidate.panelId,
      ctx.user.id,
    );

    await prisma.candidate.delete({ where: { id: candidate.id } });

    const properties: Record<string, string | number | boolean | null> = {
      room_id: panelCtx.room.id,
      panel_id: candidate.panelId,
      candidate_roll: candidate.rollNo,
      status: candidate.status,
    };
    if (candidate.completedAt && candidate.startedAt) {
      properties.interview_duration_ms =
        candidate.completedAt.getTime() - candidate.startedAt.getTime();
    }

    trackDomainEvent(
      { id: ctx.user.id, role: panelCtx.role },
      "candidate removed",
      properties,
    );

    return { id: candidate.id };
  });
