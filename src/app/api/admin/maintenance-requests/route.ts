import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adminMaintenanceRequestInclude,
  MAINTENANCE_REQUEST_CATEGORIES,
  MAINTENANCE_REQUEST_PRIORITIES,
  MAINTENANCE_REQUEST_STATUSES,
  serializeAdminMaintenanceRequest,
} from "@/lib/maintenance-requests";
import type {
  MaintenanceRequestCategory,
  MaintenanceRequestPriority,
  MaintenanceRequestStatus,
  Prisma,
} from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const where: Prisma.MaintenanceRequestWhereInput = {};

    if (status && status !== "all") {
      if (!MAINTENANCE_REQUEST_STATUSES.includes(status as MaintenanceRequestStatus)) {
        return NextResponse.json({ message: "Invalid status" }, { status: 400 });
      }
      where.status = status as MaintenanceRequestStatus;
    }

    if (priority && priority !== "all") {
      if (!MAINTENANCE_REQUEST_PRIORITIES.includes(priority as MaintenanceRequestPriority)) {
        return NextResponse.json({ message: "Invalid priority" }, { status: 400 });
      }
      where.priority = priority as MaintenanceRequestPriority;
    }

    if (category && category !== "all") {
      if (!MAINTENANCE_REQUEST_CATEGORIES.includes(category as MaintenanceRequestCategory)) {
        return NextResponse.json({ message: "Invalid category" }, { status: 400 });
      }
      where.category = category as MaintenanceRequestCategory;
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: adminMaintenanceRequestInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      requests: requests.map(serializeAdminMaintenanceRequest),
    });
  } catch (error) {
    console.error("GET /api/admin/maintenance-requests error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to load maintenance requests" },
      { status: 500 }
    );
  }
}
