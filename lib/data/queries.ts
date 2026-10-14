import "server-only";
import { prisma } from "@/lib/db";

export async function getRoomsForUser(userId: string) {
  const memberships = await prisma.roomMembership.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: {
      role: true,
      joinedAt: true,
      room: {
        select: {
          id: true,
          name: true,
          code: true,
          _count: { select: { panels: { where: { isActive: true } } } },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    id: membership.room.id,
    name: membership.room.name,
    code: membership.room.code,
    role: membership.role,
    panelCount: membership.room._count.panels,
  }));
}

export async function getBoardOverview(
  roomId: string,
  currentUserId: string,
  isAdmin: boolean,
) {
  const where = {
    roomId,
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
      where: { panel: { roomId, isActive: true } },
    }),
    prisma.panelMembership.findMany({
      where: { userId: currentUserId, panel: { roomId } },
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

export async function getPanelBoard(panelId: string, currentUserId: string) {
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
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });

  if (!panel) return null;

  return {
    id: panel.id,
    roomId: panel.roomId,
    name: panel.name,
    description: panel.description,
    isActive: panel.isActive,
    createdById: panel.createdById,
    joined: panel.members.some((m) => m.user.id === currentUserId),
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
  roomId: string,
  currentUserId: string,
) {
  const panels = await prisma.panel.findMany({
    where: { roomId, isActive: true },
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

export async function getAdminPanels(roomId: string) {
  return prisma.panel.findMany({
    where: { roomId },
    orderBy: { name: "asc" },
    include: {
      createdBy: { select: { name: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      _count: { select: { candidates: true } },
    },
  });
}

export async function listRoomMembers(roomId: string) {
  const memberships = await prisma.roomMembership.findMany({
    where: { roomId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          _count: { select: { panelMemberships: true } },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    image: membership.user.image,
    role: membership.role,
    joinedAt: membership.joinedAt,
    panelCount: membership.user._count.panelMemberships,
  }));
}
