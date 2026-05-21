import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  APPLICATION_DOCUMENTS_BUCKET,
  APPLICATION_DOCUMENT_READ_TTL_SECONDS,
} from "@/lib/application-document-upload";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string; documentId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, documentId } = await context.params;

    const document = await prisma.applicationDocument.findFirst({
      where: {
        id: documentId,
        applicationId: id,
      },
      select: {
        storagePath: true,
      },
    });

    if (!document) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(APPLICATION_DOCUMENTS_BUCKET)
      .createSignedUrl(document.storagePath, APPLICATION_DOCUMENT_READ_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { message: error?.message || "Failed to create signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(data.signedUrl, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/applications/[id]/documents/[documentId]/signed-url error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to create document signed URL" },
      { status: 500 }
    );
  }
}
