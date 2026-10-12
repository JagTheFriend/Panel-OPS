import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { readDomainConfig } from "../lib/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { rollNo: "9001" },
    update: { role: "ADMIN" },
    create: { rollNo: "9001", name: "Admin Coordinator", role: "ADMIN" },
  });

  const coordinator = await prisma.user.upsert({
    where: { rollNo: "9002" },
    update: {},
    create: { rollNo: "9002", name: "Room Coordinator", role: "USER" },
  });

  const domains = readDomainConfig().DOMAINS ?? [];
  if (domains.length === 0) {
    throw new Error("domain.json has no DOMAINS entries");
  }

  for (const data of domains) {
    const panel = await prisma.panel.upsert({
      where: { name: data.name },
      update: { description: data.description ?? null, isActive: true },
      create: {
        name: data.name,
        description: data.description ?? null,
        createdById: admin.id,
      },
    });

    await prisma.panelMembership.upsert({
      where: { panelId_userId: { panelId: panel.id, userId: admin.id } },
      update: {},
      create: { panelId: panel.id, userId: admin.id },
    });
  }

  await prisma.panel.updateMany({
    where: {
      name: { notIn: domains.map((data) => data.name) },
      isActive: true,
    },
    data: { isActive: false },
  });

  const webPanel = await prisma.panel.findUnique({
    where: { name: "Web Development" },
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
          addedById: coordinator.id,
          position: position++,
          startedAt: sample.status === "WAITING" ? null : new Date(),
          completedAt: sample.status === "DONE" ? new Date() : null,
          ...sample,
        },
      });
    }
  }

  console.log("Seed complete:", {
    admin: admin.rollNo,
    coordinator: coordinator.rollNo,
    panels: domains.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
