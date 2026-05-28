import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  LeaseValidationError,
  parseLeasePayload,
  serializeLease,
  updateLease,
} from "@/lib/resident-leases";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const payload = parseLeasePayload(await request.json());
    const lease = await updateLease(id, payload);

    return NextResponse.json({ lease: serializeLease(lease) });
  } catch (error) {
    console.error("PATCH /api/admin/leases/[id] error:", error);

    if (error instanceof LeaseValidationError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to save lease" },
      { status: 500 }
    );
  }
}
