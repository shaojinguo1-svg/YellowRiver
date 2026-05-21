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

const PROPERTY_IMAGES_BUCKET = "property-images";
const APPLICATION_DOCUMENTS_BUCKET = "application-documents";

async function ensureBucket(
  name: string,
  options: {
    public: boolean;
    fileSizeLimit: number;
    allowedMimeTypes: string[];
  }
) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === name);

  if (exists) {
    const { error } = await supabase.storage.updateBucket(name, options);
    if (error) {
      console.error(`❌ Failed to update bucket "${name}":`, error.message);
      process.exit(1);
    }
    console.log(`✅ Bucket "${name}" already exists; configuration updated`);
    return;
  }

  const { error } = await supabase.storage.createBucket(name, options);
  if (error) {
    console.error(`❌ Failed to create bucket "${name}":`, error.message);
    process.exit(1);
  }
  console.log(`✅ Created bucket "${name}"`);
}

async function main() {
  console.log("🗂️  Setting up Supabase Storage...\n");

  // ── 1. Create bucket if it doesn't exist ──────────────────────
  await ensureBucket(PROPERTY_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  await ensureBucket(APPLICATION_DOCUMENTS_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  });

  // ── 2. Create RLS policies ────────────────────────────────────
  console.log("\n📋 Setting up RLS policies on storage.objects...");

  const pool = new Pool({ connectionString: databaseUrl });

  const oldPoliciesToDrop = [
    "Public read property-images",
    "Auth upload property-images",
    "Auth update property-images",
    "Auth delete property-images",
    "Public read application-documents",
    "Auth upload application-documents",
    "Auth update application-documents",
    "Auth delete application-documents",
  ];

  try {
    for (const policyName of oldPoliciesToDrop) {
      await pool.query(`DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`);
    }

    await pool.query(`
      CREATE POLICY "Public read property-images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = '${PROPERTY_IMAGES_BUCKET}');
    `);

    console.log("   ✅ property-images SELECT → public");
    console.log("   ✅ property-images writes → service role only");
    console.log("   ✅ application-documents reads/writes → service role or signed URL only");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Policy error: ${msg}`);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
  console.log("\n🎉 Storage setup complete. Run the storage/data audit before launch.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
