import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

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

  const panelsData = [
    {
      name: "Web Development",
      description: "Frontend, backend & full-stack roles",
    },
    {
      name: "Data Science",
      description: "ML, analytics and data engineering",
    },
    {
      name: "UI/UX Design",
      description: "Product design & research",
    },
    {
      name: "DevOps & Cloud",
      description: "Infrastructure, CI/CD and SRE",
    },
  ] as const;

  for (const data of panelsData) {
    const panel = await prisma.panel.upsert({
      where: { name: data.name },
      update: { description: data.description },
      create: { ...data, createdById: admin.id },
    });

    await prisma.panelMembership.upsert({
      where: { panelId_userId: { panelId: panel.id, userId: admin.id } },
      update: {},
      create: { panelId: panel.id, userId: admin.id },
    });
  }

  const webPanel = await prisma.panel.findUniqueOrThrow({
    where: { name: "Web Development" },
    include: { candidates: true },
  });

  if (webPanel.candidates.length === 0) {
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
    panels: panelsData.length,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
