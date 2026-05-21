import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const PROPERTY_IMAGES_BUCKET = "property-images";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const uploadRequestSchema = z.object({
  propertyId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_IMAGE_SIZE),
  mimeType: z.enum(IMAGE_MIME_TYPES),
});

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function fileNameMatchesMime(fileName: string, mimeType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (mimeType === "image/jpeg") {
    return ext === "jpg" || ext === "jpeg";
  }
  return ext === MIME_TO_EXTENSION[mimeType];
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!fileNameMatchesMime(data.fileName, data.mimeType)) {
      return NextResponse.json(
        { message: "File extension does not match the image type" },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const storagePath = `${data.propertyId}/${randomUUID()}.${MIME_TO_EXTENSION[data.mimeType]}`;
    const supabase = createServiceRoleClient();
    const { data: signedUpload, error } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error("Property image signed URL error:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);

    return NextResponse.json(
      {
        signedUrl: signedUpload.signedUrl,
        token: signedUpload.token,
        path: signedUpload.path,
        publicUrl,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("POST /api/property-images/upload-url error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to create property image upload URL" },
      { status: 500 }
    );
  }
}
