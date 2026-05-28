import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getCurrentLeaseForUser,
  serializeCurrentLeaseResident,
} from "@/lib/resident-leases";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const leaseResident = await getCurrentLeaseForUser(user.id);

    return NextResponse.json({
      leaseResident: leaseResident
        ? serializeCurrentLeaseResident(leaseResident)
        : null,
    });
  } catch (error) {
    console.error("GET /api/tenant/current-lease error:", error);
    return NextResponse.json(
      { message: "Failed to load current lease" },
      { status: 500 }
    );
  }
}
