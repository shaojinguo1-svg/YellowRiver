/**
 * Create the required Supabase Storage bucket and RLS policies.
 *
 * Usage:
 *   npx tsx scripts/setup-storage.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL (or DIRECT_URL) — for creating RLS policies
 */

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!databaseUrl) {
  console.error("❌ Missing DATABASE_URL or DIRECT_URL for RLS policy setup");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const BUCKET = "property-images";

async function main() {
  console.log("🗂️  Setting up Supabase Storage...\n");

  // ── 1. Create bucket if it doesn't exist ──────────────────────
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (exists) {
    console.log(`✅ Bucket "${BUCKET}" already exists`);
  } else {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) {
      console.error(`❌ Failed to create bucket:`, error.message);
      process.exit(1);
    }
    console.log(`✅ Created bucket "${BUCKET}"`);
  }

  // ── 2. Create RLS policies ────────────────────────────────────
  console.log("\n📋 Setting up RLS policies on storage.objects...");

  const pool = new Pool({ connectionString: databaseUrl });

  const policies = [
    {
      name: "Public read property-images",
      action: "SELECT",
      role: "public",
      using: `bucket_id = '${BUCKET}'`,
      check: null,
    },
    {
      name: "Auth upload property-images",
      action: "INSERT",
      role: "authenticated",
      using: null,
      check: `bucket_id = '${BUCKET}'`,
    },
    {
      name: "Auth update property-images",
      action: "UPDATE",
      role: "authenticated",
      using: `bucket_id = '${BUCKET}'`,
      check: null,
    },
    {
      name: "Auth delete property-images",
      action: "DELETE",
      role: "authenticated",
      using: `bucket_id = '${BUCKET}'`,
      check: null,
    },
  ];

  try {
    for (const p of policies) {
      // Drop existing policy
      await pool.query(`DROP POLICY IF EXISTS "${p.name}" ON storage.objects;`);

      // Build CREATE POLICY statement
      let sql = `CREATE POLICY "${p.name}" ON storage.objects FOR ${p.action} TO ${p.role}`;
      if (p.using) sql += ` USING (${p.using})`;
      if (p.check) sql += ` WITH CHECK (${p.check})`;
      sql += ";";

      await pool.query(sql);
      console.log(`   ✅ ${p.action} → ${p.role}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Policy error: ${msg}`);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  console.log("\n🎉 Storage setup complete! Image uploads should now work.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
