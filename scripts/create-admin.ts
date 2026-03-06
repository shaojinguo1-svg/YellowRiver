import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

// Admin credentials
const ADMIN_EMAIL = "shaojin.guo1@gmail.com";
const ADMIN_PASSWORD = "Gshj123456";
const ADMIN_FIRST_NAME = "Shaojin";
const ADMIN_LAST_NAME = "Guo";

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  console.log("🔧 Creating admin user...\n");

  // 1. Create Supabase Admin client (service role bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Create user in Supabase Auth
  console.log(`📧 Creating Supabase Auth user: ${ADMIN_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: ADMIN_FIRST_NAME,
      last_name: ADMIN_LAST_NAME,
    },
  });

  let supabaseUserId: string;

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("⚠️  Supabase Auth user already exists, fetching...");
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);
      if (!existingUser) {
        console.error("❌ Could not find existing user");
        process.exit(1);
      }
      supabaseUserId = existingUser.id;
      console.log(`✅ Found existing auth user: ${supabaseUserId}`);
    } else {
      console.error("❌ Failed to create Supabase Auth user:", authError.message);
      process.exit(1);
    }
  } else {
    supabaseUserId = authData.user.id;
    console.log(`✅ Supabase Auth user created: ${supabaseUserId}`);
  }

  // 3. Create Prisma User record with adapter
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`\n🗄️  Creating Prisma User record with ADMIN role...`);

    const user = await prisma.user.upsert({
      where: { supabaseId: supabaseUserId },
      update: { role: "ADMIN", email: ADMIN_EMAIL },
      create: {
        supabaseId: supabaseUserId,
        email: ADMIN_EMAIL,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: "ADMIN",
      },
    });

    console.log(`✅ Prisma User created/updated:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Supabase ID: ${user.supabaseId}`);
    console.log(`\n🎉 Admin user setup complete!`);
    console.log(`   Login at /login with:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error("❌ Failed to create Prisma User:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
