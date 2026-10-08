"use server";

import { trackDomainEvent } from "@/lib/analytics/posthog-server";
import { assertPanelAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionError } from "@/lib/errors";
import {
  applyStatusTransition,
  type CandidateStatus,
  nextFreeSeat,
  occupiedSeats,
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

    const panel = await prisma.panel.findUnique({ where: { id: panelId } });
    if (!panel || !panel.isActive) {
      throw new ActionError(
        "NOT_FOUND",
        "Panel not found or no longer active.",
      );
    }
    await assertPanelAccess(ctx.user, panelId);

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

    const candidate = await prisma.candidate.create({
      data: {
        panelId,
        rollNo,
        name: name || null,
        status: "WAITING",
        position: (last?.position ?? -1) + 1,
        addedById: ctx.user.id,
      },
    });

    trackDomainEvent(ctx.user, "candidate added", {
      panel_id: panelId,
      panel_name: panel.name,
      candidate_roll: rollNo,
    });

    return { id: candidate.id };
  });

/**
 * Moves a candidate between columns (with optional insert index) and keeps
 * station occupancy + kanban ordering consistent in one transaction.
 */
async function moveCandidate(
  candidateId: string,
  toStatus: CandidateStatus,
  index?: number,
) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { panel: true },
  });
  if (!candidate) {
    throw new ActionError("NOT_FOUND", "Candidate not found.");
  }

  const fromStatus = candidate.status;
  const all = await prisma.candidate.findMany({
    where: { panelId: candidate.panelId },
  });

  const taken = occupiedSeats(all.filter((c) => c.id !== candidate.id));
  const transition = applyStatusTransition(
    candidate,
    toStatus,
    nextFreeSeat(taken, candidate.panel.seatCount),
  );
  if (!transition.ok) {
    throw new ActionError("CONFLICT", transition.error);
  }

  const columnIds = (status: CandidateStatus) =>
    all
      .filter((c) => c.status === status && c.id !== candidate.id)
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.joinedAt.getTime() - b.joinedAt.getTime(),
      )
      .map((c) => c.id);

  const fromIds = columnIds(fromStatus);
  const toIds = columnIds(toStatus);
  const insertAt = Math.max(0, Math.min(index ?? toIds.length, toIds.length));
  const finalTo = [
    ...toIds.slice(0, insertAt),
    candidate.id,
    ...toIds.slice(insertAt),
  ];

  const operations = [
    prisma.candidate.update({
      where: { id: candidate.id },
      data: { ...transition.value, position: insertAt },
    }),
  ];

  if (fromStatus !== toStatus) {
    operations.push(
      ...fromIds.map((id, i) =>
        prisma.candidate.update({ where: { id }, data: { position: i } }),
      ),
    );
  }

  operations.push(
    ...finalTo
      .map((id, i) => ({ id, i }))
      .filter(({ id }) => id !== candidate.id)
      .map(({ id, i }) =>
        prisma.candidate.update({ where: { id }, data: { position: i } }),
      ),
  );

  await prisma.$transaction(operations);

  return { candidate, toStatus, fromStatus };
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
    await assertPanelAccess(ctx.user, existing.panelId);

    const result = await moveCandidate(id, status, index);

    if (result.fromStatus !== result.toStatus) {
      const eventName =
        status === "IN_INTERVIEW"
          ? "interview started"
          : status === "DONE"
            ? "interview marked done"
            : "interview reopened";

      const properties: Record<string, string | number | boolean | null> = {
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

      trackDomainEvent(ctx.user, eventName, properties);
    }

    return { id, status };
  });

export const reorderCandidates = authedClient
  .inputSchema(reorderCandidatesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { panelId, orderedIds } = parsedInput;
    await assertPanelAccess(ctx.user, panelId);

    const candidates = await prisma.candidate.findMany({
      where: { panelId, id: { in: orderedIds } },
      select: { id: true },
    });
    if (candidates.length !== new Set(orderedIds).size) {
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
    await assertPanelAccess(ctx.user, candidate.panelId);

    await prisma.candidate.update({ where: { id }, data: { name } });

    trackDomainEvent(ctx.user, "candidate updated", {
      panel_id: candidate.panelId,
      candidate_roll: candidate.rollNo,
    });

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
    await assertPanelAccess(ctx.user, candidate.panelId);

    await prisma.candidate.delete({ where: { id: candidate.id } });

    const properties: Record<string, string | number | boolean | null> = {
      panel_id: candidate.panelId,
      candidate_roll: candidate.rollNo,
      status: candidate.status,
    };
    if (candidate.completedAt && candidate.startedAt) {
      properties.interview_duration_ms =
        candidate.completedAt.getTime() - candidate.startedAt.getTime();
    }

    trackDomainEvent(ctx.user, "candidate removed", properties);

    return { id: candidate.id };
  });
