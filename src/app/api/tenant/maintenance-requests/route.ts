import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createTenantMaintenanceRequest,
  listTenantMaintenanceRequests,
  MaintenanceRequestValidationError,
  parseTenantMaintenancePayload,
  serializeTenantMaintenanceRequest,
} from "@/lib/maintenance-requests";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const requests = await listTenantMaintenanceRequests(user.id);

    return NextResponse.json({
      requests: requests.map(serializeTenantMaintenanceRequest),
    });
  } catch (error) {
    console.error("GET /api/tenant/maintenance-requests error:", error);
    return NextResponse.json(
      { message: "Failed to load maintenance requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const limited = checkRateLimit(request, {
      keyPrefix: "maintenance-request-submit",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      secondaryKey: user.id,
    });
    if (limited.limited) {
      return rateLimitResponse(limited.retryAfter);
    }

    const payload = parseTenantMaintenancePayload(await request.json());
    const maintenanceRequest = await createTenantMaintenanceRequest(user.id, payload);

    return NextResponse.json(
      { request: serializeTenantMaintenanceRequest(maintenanceRequest) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tenant/maintenance-requests error:", error);

    if (error instanceof MaintenanceRequestValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { message: "Failed to submit maintenance request" },
      { status: 500 }
    );
  }
}
