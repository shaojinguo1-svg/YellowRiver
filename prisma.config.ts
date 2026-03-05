import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for Next.js projects
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection for CLI operations (migrations, push)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
