import { NextResponse } from "next/server";

// Generic uploads are intentionally disabled because property images and
// application documents have different authorization models.
export async function POST() {
  return NextResponse.json(
    {
      message:
        "Generic uploads are disabled. Use the dedicated property image or application document upload endpoint.",
    },
    { status: 410 }
  );
}
