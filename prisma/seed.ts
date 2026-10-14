import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { signedSessionCookie } from "./session-cookie";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SESSION_TOKENS = {
  admin: "dev-session-admin",
  member: "dev-session-member",
  outsider: "dev-session-outsider",
  signout: "dev-session-signout",
};

const DEMO_ROOM = {
  name: "Demo Room",
  code: "DEMO42",
  adminPin: "7331",
  normalPin: "1234",
};

const DOMAINS = [
  {
    name: "Web Development",
    description: "Frontend, backend, and full-stack queues",
  },
  {
    name: "Data Science",
    description: "ML, analytics, and data engineering queues",
  },
  {
    name: "UI/UX Design",
    description: "Product design and research queues",
  },
  {
    name: "DevOps & Cloud",
    description: "Infrastructure, SRE, and platform queues",
  },
];

async function ensureUser(email: string, name: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name },
    create: { name, email, emailVerified: true },
  });
}

async function ensureSession(userId: string, token: string) {
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  return prisma.session.upsert({
    where: { token },
    update: { userId, expiresAt },
    create: { userId, token, expiresAt },
  });
}

async function main() {
  const admin = await ensureUser("admin@panelops.dev", "Admin Coordinator");
  const member = await ensureUser("member@panelops.dev", "Priya Panelist");
  const outsider = await ensureUser("outsider@panelops.dev", "New Signin");

  await ensureSession(admin.id, SESSION_TOKENS.admin);
  await ensureSession(member.id, SESSION_TOKENS.member);
  await ensureSession(outsider.id, SESSION_TOKENS.outsider);
  await ensureSession(admin.id, SESSION_TOKENS.signout);

  const room = await prisma.room.upsert({
    where: { code: DEMO_ROOM.code },
    update: {
      name: DEMO_ROOM.name,
      adminPin: DEMO_ROOM.adminPin,
      normalPin: DEMO_ROOM.normalPin,
    },
    create: {
      ...DEMO_ROOM,
      createdById: admin.id,
    },
  });

  for (const [userId, role] of [
    [admin.id, "ADMIN"],
    [member.id, "USER"],
  ] as const) {
    await prisma.roomMembership.upsert({
      where: { roomId_userId: { roomId: room.id, userId } },
      update: { role },
      create: { roomId: room.id, userId, role },
    });
  }

  const memberPanels = ["Web Development", "Data Science"];

  for (const data of DOMAINS) {
    const panel = await prisma.panel.upsert({
      where: { roomId_name: { roomId: room.id, name: data.name } },
      update: { description: data.description, isActive: true },
      create: {
        roomId: room.id,
        name: data.name,
        description: data.description,
        createdById: admin.id,
      },
    });

    const joiners = memberPanels.includes(data.name)
      ? [admin.id, member.id]
      : [admin.id];
    for (const userId of joiners) {
      await prisma.panelMembership.upsert({
        where: { panelId_userId: { panelId: panel.id, userId } },
        update: {},
        create: { panelId: panel.id, userId },
      });
    }
  }

  await prisma.panel.updateMany({
    where: {
      roomId: room.id,
      name: { notIn: DOMAINS.map((data) => data.name) },
      isActive: true,
      createdById: admin.id,
    },
    data: { isActive: false },
  });

  const webPanel = await prisma.panel.findUnique({
    where: {
      roomId_name: { roomId: room.id, name: "Web Development" },
    },
    include: { candidates: true },
  });

  if (webPanel && webPanel.candidates.length === 0) {
    const samples = [
      {
        rollNo: "1011",
        name: "Aarav Sharma",
        status: "IN_INTERVIEW" as const,
      },
      {
        rollNo: "1042",
        name: "Diya Patel",
        status: "IN_INTERVIEW" as const,
      },
      { rollNo: "1075", name: "Rohan Kumar", status: "WAITING" as const },
      { rollNo: "1088", name: "Ananya Singh", status: "WAITING" as const },
      { rollNo: "1103", name: "Kabir Mehta", status: "DONE" as const },
    ];

    let position = 0;
    for (const sample of samples) {
      await prisma.candidate.create({
        data: {
          panelId: webPanel.id,
          addedById: admin.id,
          position: position++,
          startedAt: sample.status === "WAITING" ? null : new Date(),
          completedAt: sample.status === "DONE" ? new Date() : null,
          ...sample,
        },
      });
    }
  }

  console.log("Seed complete:", {
    room: `${DEMO_ROOM.name} (${DEMO_ROOM.code})`,
    pins: `admin ${DEMO_ROOM.adminPin} / normal ${DEMO_ROOM.normalPin}`,
    panels: DOMAINS.length,
    sessions: {
      admin: signedSessionCookie(SESSION_TOKENS.admin),
      member: signedSessionCookie(SESSION_TOKENS.member),
      outsider: signedSessionCookie(SESSION_TOKENS.outsider),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
