import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/generated/prisma/client";

const VALID_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];

// Valid status transitions: from -> allowed destinations
const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "WITHDRAWN"],
  APPROVED: ["UNDER_REVIEW"],
  REJECTED: ["UNDER_REVIEW"],
  WITHDRAWN: [],
};

// GET /api/applications/[id] - Fetch a single application
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const application = await prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        documents: true,
        property: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/[id] - Update application status and admin notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { status, adminNotes } = body as {
      status?: string;
      adminNotes?: string;
    };

    // Fetch the current application
    const existing = await prisma.rentalApplication.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Validate and handle status change
    if (status && status !== existing.status) {
      if (!VALID_STATUSES.includes(status as ApplicationStatus)) {
        return NextResponse.json(
          { message: `Invalid status: ${status}` },
          { status: 400 }
        );
      }

      const allowedTransitions =
        STATUS_TRANSITIONS[existing.status as ApplicationStatus] || [];
      if (!allowedTransitions.includes(status as ApplicationStatus)) {
        return NextResponse.json(
          {
            message: `Cannot transition from ${existing.status} to ${status}. Allowed transitions: ${allowedTransitions.join(", ") || "none"}`,
          },
          { status: 400 }
        );
      }

      updateData.status = status;
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = admin.id;
    }

    // Handle admin notes update
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No changes to apply" },
        { status: 400 }
      );
    }

    const updated = await prisma.rentalApplication.update({
      where: { id },
      data: updateData,
      include: {
        documents: true,
        property: true,
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/applications/[id] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update application" },
      { status: 500 }
    );
  }
}
