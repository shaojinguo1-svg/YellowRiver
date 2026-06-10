import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for Next.js projects
config({ path: ".env.local" });

const databaseUrl = process.env["DATABASE_URL"] ?? "";
const directUrl = process.env["DIRECT_URL"];

// prisma migrate takes pg_advisory_lock, which does not survive the
// transaction-mode pooler (Supavisor :6543). Falling back to a pooled
// DATABASE_URL silently would corrupt migrate runs — fail loudly instead.
const looksPooled =
  databaseUrl.includes(":6543") || databaseUrl.includes("pooler.supabase.com");
if (looksPooled && !directUrl) {
  throw new Error(
    "DATABASE_URL points at the transaction-mode pooler, but DIRECT_URL is unset. " +
      "Prisma migrations need a direct connection (pg_advisory_lock does not work " +
      "through the pooler). Set DIRECT_URL to the db.<project-ref>.supabase.co:5432 " +
      "connection string."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection for CLI operations (migrations, push)
    url: directUrl || databaseUrl,
  },
});
