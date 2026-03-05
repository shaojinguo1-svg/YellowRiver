import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { bucket, path, contentType } = body;

    if (!bucket || !path || !contentType) {
      return NextResponse.json(
        { message: "Missing required fields: bucket, path, contentType" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
