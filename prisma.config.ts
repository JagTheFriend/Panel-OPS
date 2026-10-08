import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Prisma 7 no longer reads `url` from schema.prisma.
  // Falls back to "" so `npm install` (postinstall generate) works before .env exists.
  // For Neon, set DATABASE_URL to the DIRECT (unpooled) URL here; the app runtime
  // uses the pooled URL in .env.
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "",
  },
});
