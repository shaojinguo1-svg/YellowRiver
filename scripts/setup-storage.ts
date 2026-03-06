/**
 * Create the required Supabase Storage buckets.
 *
 * Usage:
 *   npx tsx scripts/setup-storage.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load env vars
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("🗂️  Setting up Supabase Storage buckets...\n");

  // 1. Create property-images bucket
  const { data: existing, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("❌ Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const bucketName = "property-images";
  const bucketExists = existing?.some((b) => b.name === bucketName);

  if (bucketExists) {
    console.log(`✅ Bucket "${bucketName}" already exists`);
  } else {
    const { error: createError } = await supabase.storage.createBucket(
      bucketName,
      {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      }
    );

    if (createError) {
      console.error(`❌ Failed to create bucket "${bucketName}":`, createError.message);
      process.exit(1);
    }

    console.log(`✅ Created bucket "${bucketName}" (public, 10MB limit, JPEG/PNG/WebP)`);
  }

  console.log("\n🎉 Storage setup complete!");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
