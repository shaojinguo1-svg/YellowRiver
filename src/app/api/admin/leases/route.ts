import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAdminLeaseInclude,
  createLease,
  LeaseValidationError,
  parseLeasePayload,
  serializeLease,
} from "@/lib/resident-leases";

export async function GET() {
  try {
    await requireAdmin();

    const leases = await prisma.lease.findMany({
      include: getAdminLeaseInclude(),
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ leases: leases.map(serializeLease) });
  } catch (error) {
    console.error("GET /api/admin/leases error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Failed to load leases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const payload = parseLeasePayload(await request.json());
    const lease = await createLease(payload);

    return NextResponse.json({ lease: serializeLease(lease) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/leases error:", error);

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
