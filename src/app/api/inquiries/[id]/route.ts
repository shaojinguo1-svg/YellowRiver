import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildInquiryUpdateData } from "@/lib/inquiry-status";

// PATCH /api/inquiries/[id] - Update inquiry status and internal reply note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }

    const status = typeof body.status === "string" ? body.status : undefined;
    const adminReply = typeof body.adminReply === "string" ? body.adminReply : undefined;

    // Fetch the current inquiry
    const existing = await prisma.contactInquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Inquiry not found" },
        { status: 404 }
      );
    }

    const update = buildInquiryUpdateData(existing.status, {
      status,
      adminReply,
    });
    if (!update.ok) {
      return NextResponse.json(
        { message: update.message },
        { status: update.status }
      );
    }

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: update.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/inquiries/[id] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to save inquiry changes" },
      { status: 500 }
    );
  }
}
