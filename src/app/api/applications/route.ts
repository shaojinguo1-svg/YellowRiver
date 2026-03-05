import { NextRequest, NextResponse } from "next/server";
import { applicationSchema } from "@/validations/application";

function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-5);
  return `YR-${year}-${timestamp}`;
}

// GET /api/applications - List applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("propertyId");

    // TODO: Add authentication check for admin access
    // TODO: Query database when connected

    // For now, return mock empty response
    return NextResponse.json({
      applications: [],
      total: 0,
      filters: {
        status: status || "all",
        propertyId: propertyId || "all",
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST /api/applications - Submit new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with full application schema
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const applicationNumber = generateApplicationNumber();

    // TODO: Save to database when connected
    // For now, return mock success response
    return NextResponse.json(
      {
        applicationNumber,
        status: "SUBMITTED",
        message: "Application submitted successfully",
        submittedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
