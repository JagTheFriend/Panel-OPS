import "server-only";
import { prisma } from "@/lib/db";

export async function getBoardOverview(
  currentUserId: string,
  isAdmin: boolean,
) {
  const panels = await prisma.panel.findMany({
    where: {
      isActive: true,
      ...(isAdmin ? {} : { members: { some: { userId: currentUserId } } }),
    },
    orderBy: { name: "asc" },
    include: {
      candidates: { select: { status: true } },
      members: { select: { userId: true } },
    },
  });

  return panels.map((panel) => ({
    id: panel.id,
    name: panel.name,
    description: panel.description,
    memberCount: panel.members.length,
    joined: panel.members.some((m) => m.userId === currentUserId),
    waiting: panel.candidates.filter((c) => c.status === "WAITING").length,
    interviewing: panel.candidates.filter((c) => c.status === "IN_INTERVIEW")
      .length,
    done: panel.candidates.filter((c) => c.status === "DONE").length,
  }));
}

export async function getPanelBoard(panelId: string) {
  const panel = await prisma.panel.findUnique({
    where: { id: panelId },
    include: {
      candidates: { orderBy: [{ position: "asc" }, { joinedAt: "asc" }] },
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
    include: {
      members: { select: { userId: true } },
      _count: { select: { candidates: true } },
    },
  });

  return panels.map((panel) => ({
    id: panel.id,
    name: panel.name,
    description: panel.description,
    memberCount: panel.members.length,
    queueCount: panel._count.candidates,
    joined: panel.members.some((m) => m.userId === currentUserId),
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
