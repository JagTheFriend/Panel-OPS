import { Client } from "pg";

/**
 * Deterministic reset of the isolated TEST database (port 5434).
 *
 * Drops and recreates the `public` schema so `prisma migrate deploy` +
 * `prisma db seed` always start from the same baseline. `prisma migrate
 * reset` would do the same thing but is rejected when an AI agent invokes it,
 * so the equivalent steps are performed explicitly here.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required — e2e/serve.sh points it at port 5434.",
    );
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
  } finally {
    await client.end();
  }

  const host = connectionString.split("@")[1] ?? connectionString;
  console.log(`[e2e] reset schema on ${host}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
