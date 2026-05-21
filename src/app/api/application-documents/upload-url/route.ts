import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  APPLICATION_DOCUMENT_MIME_TYPES,
  MAX_APPLICATION_DOCUMENT_SIZE,
  createApplicationDocumentUploadToken,
  extensionForMimeType,
} from "@/lib/application-document-upload";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { applicationDocumentCategorySchema } from "@/validations/application";

const uploadRequestSchema = z.object({
  uploadSessionId: z.string().uuid().optional(),
  category: applicationDocumentCategorySchema,
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_APPLICATION_DOCUMENT_SIZE),
  mimeType: z.enum(APPLICATION_DOCUMENT_MIME_TYPES),
});

function fileNameMatchesMime(fileName: string, mimeType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const expected = extensionForMimeType(mimeType);
  if (mimeType === "image/jpeg") {
    return ext === "jpg" || ext === "jpeg";
  }
  return ext === expected;
}

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, {
    keyPrefix: "application-document-upload-url",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (limited.limited) {
    return rateLimitResponse(limited.retryAfter);
  }

  try {
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
        { message: "File extension does not match the document type" },
        { status: 400 }
      );
    }

    const result = await createApplicationDocumentUploadToken({
      ...data,
      uploadSessionId: data.uploadSessionId || randomUUID(),
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("POST /api/application-documents/upload-url error:", error);
    return NextResponse.json(
      { message: "Failed to create document upload URL" },
      { status: 500 }
    );
  }
}
