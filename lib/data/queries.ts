import "server-only";
import { prisma } from "@/lib/db";

export async function getBoardOverview(
  currentUserId: string,
  isAdmin: boolean,
) {
  const where = {
    isActive: true,
    ...(isAdmin ? {} : { members: { some: { userId: currentUserId } } }),
  };

  const [panels, tallies, memberships] = await Promise.all([
    prisma.panel.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    }),
    prisma.candidate.groupBy({
      by: ["panelId", "status"],
      _count: { _all: true },
      where: { panel: { isActive: true } },
    }),
    prisma.panelMembership.findMany({
      where: { userId: currentUserId },
      select: { panelId: true },
    }),
  ]);

  const byPanel = new Map<string, Record<string, number>>();
  for (const row of tallies) {
    const tally = byPanel.get(row.panelId) ?? {};
    tally[row.status] = row._count._all;
    byPanel.set(row.panelId, tally);
  }
  const joinedIds = new Set(memberships.map((m) => m.panelId));

  return panels.map((panel) => {
    const tally = byPanel.get(panel.id);
    return {
      id: panel.id,
      name: panel.name,
      description: panel.description,
      joined: joinedIds.has(panel.id),
      waiting: tally?.WAITING ?? 0,
      interviewing: tally?.IN_INTERVIEW ?? 0,
      done: tally?.DONE ?? 0,
    };
  });
}

export async function getPanelName(panelId: string) {
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    select: { name: true },
  });
  return panel?.name ?? null;
}

export async function getPanelBoard(panelId: string) {
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    include: {
      candidates: {
        orderBy: [{ position: "asc" }, { joinedAt: "asc" }],
        select: {
          id: true,
          rollNo: true,
          name: true,
          status: true,
          joinedAt: true,
          startedAt: true,
          completedAt: true,
        },
      },
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          user: { select: { id: true, rollNo: true, name: true, role: true } },
        },
      },
    },
  });

  if (!panel) return null;

  return {
    id: panel.id,
    name: panel.name,
    description: panel.description,
    isActive: panel.isActive,
    createdById: panel.createdById,
    candidates: panel.candidates,
    members: panel.members.map((m) => m.user),
    stats: {
      waiting: panel.candidates.filter((c) => c.status === "WAITING").length,
      interviewing: panel.candidates.filter((c) => c.status === "IN_INTERVIEW")
        .length,
      done: panel.candidates.filter((c) => c.status === "DONE").length,
    },
  };
}

export async function getDirectoryPanels(
  currentUserId: string,
  isAdmin: boolean,
) {
  const panels = await prisma.panel.findMany({
    where: {
      isActive: true,
      ...(isAdmin ? {} : { members: { some: { userId: currentUserId } } }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { candidates: { where: { status: "WAITING" } } } },
      members: { where: { userId: currentUserId }, select: { id: true } },
    },
  });

  return panels.map((panel) => ({
    id: panel.id,
    name: panel.name,
    description: panel.description,
    queueCount: panel._count.candidates,
    joined: panel.members.length > 0,
  }));
}

export async function getAdminPanels() {
  return prisma.panel.findMany({
    orderBy: { name: "asc" },
    include: {
      createdBy: { select: { rollNo: true } },
      members: {
        include: {
          user: { select: { id: true, rollNo: true, name: true, role: true } },
        },
      },
      _count: { select: { candidates: true } },
    },
  });
}

export async function listMembers() {
  return prisma.user.findMany({
    orderBy: [{ role: "asc" }, { rollNo: "asc" }],
    include: {
      _count: {
        select: {
          panels: true,
          addedCandidates: true,
          createdPanels: true,
        },
      },
    },
  });
}
