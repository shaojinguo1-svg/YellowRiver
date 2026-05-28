import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  cancelTenantMaintenanceRequest,
  MaintenanceRequestValidationError,
  serializeTenantMaintenanceRequest,
} from "@/lib/maintenance-requests";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const maintenanceRequest = await cancelTenantMaintenanceRequest(id, user.id);

    return NextResponse.json({
      request: serializeTenantMaintenanceRequest(maintenanceRequest),
    });
  } catch (error) {
    console.error("PATCH /api/tenant/maintenance-requests/[id] error:", error);

    if (error instanceof MaintenanceRequestValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { message: "Failed to update maintenance request" },
      { status: 500 }
    );
  }
}
