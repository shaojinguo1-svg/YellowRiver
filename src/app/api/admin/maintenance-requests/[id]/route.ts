import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  MaintenanceRequestValidationError,
  parseAdminMaintenancePayload,
  serializeAdminMaintenanceRequest,
  updateAdminMaintenanceRequest,
} from "@/lib/maintenance-requests";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const payload = parseAdminMaintenancePayload(await request.json());
    const maintenanceRequest = await updateAdminMaintenanceRequest(id, payload);

    return NextResponse.json({
      request: serializeAdminMaintenanceRequest(maintenanceRequest),
    });
  } catch (error) {
    console.error("PATCH /api/admin/maintenance-requests/[id] error:", error);

    if (error instanceof MaintenanceRequestValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to update maintenance request" },
      { status: 500 }
    );
  }
}
