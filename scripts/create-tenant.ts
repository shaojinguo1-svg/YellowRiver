import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`❌ Missing ${name} in .env.local`);
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const DATABASE_URL = requireEnv("DATABASE_URL");
const EMAIL = requireEnv("TENANT_EMAIL");
const PASSWORD = requireEnv("TENANT_PASSWORD");
const FIRST_NAME = process.env.TENANT_FIRST_NAME?.trim() || "Tenant";
const LAST_NAME = process.env.TENANT_LAST_NAME?.trim() || "User";

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("🔧 Creating tenant user...\n");

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: FIRST_NAME, last_name: LAST_NAME },
  });

  let supabaseUserId: string;

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("⚠️  User already exists, fetching...");
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === EMAIL);
      if (!existing) { console.error("❌ Not found"); process.exit(1); }
      supabaseUserId = existing.id;
    } else {
      console.error("❌ Auth error:", authError.message); process.exit(1);
    }
  } else {
    supabaseUserId = authData.user.id;
    console.log(`✅ Supabase Auth user created: ${supabaseUserId}`);
  }

  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUserId },
      update: { email: EMAIL },
      create: {
        supabaseId: supabaseUserId,
        email: EMAIL,
        firstName: FIRST_NAME,
        lastName: LAST_NAME,
        role: "TENANT",
      },
    });

    console.log(`✅ Tenant user created:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n🎉 Done! Login with the TENANT_EMAIL and TENANT_PASSWORD you provided.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
