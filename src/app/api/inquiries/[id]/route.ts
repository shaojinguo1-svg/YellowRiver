import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { InquiryStatus } from "@/generated/prisma/client";

const VALID_STATUSES: InquiryStatus[] = ["NEW", "READ", "REPLIED", "ARCHIVED"];

// PATCH /api/inquiries/[id] - Update inquiry status and admin reply
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

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status) {
      if (!VALID_STATUSES.includes(status as InquiryStatus)) {
        return NextResponse.json(
          { message: `Invalid status: ${status}. Valid statuses: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (adminReply !== undefined) {
      updateData.adminReply = adminReply;
      updateData.repliedAt = new Date();

      // If providing a reply, also set status to REPLIED if not already set
      if (!status) {
        updateData.status = "REPLIED";
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No changes to apply" },
        { status: 400 }
      );
    }

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: updateData,
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
      { message: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
