import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { applicationSchema } from "@/validations/application";
import {
  sendApplicationConfirmation,
  sendAdminNewApplicationNotification,
} from "@/lib/email";

function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `YR-${year}-${random}`;
}

// GET /api/applications - List applications (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const propertyId = searchParams.get("propertyId");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (propertyId && propertyId !== "all") {
      where.propertyId = propertyId;
    }

    const [applications, total] = await Promise.all([
      prisma.rentalApplication.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              city: true,
              state: true,
            },
          },
          applicant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.rentalApplication.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/applications error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch applications" },
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
          message: "Validation failed",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const applicationNumber = generateApplicationNumber();

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: body.propertyId },
      select: { id: true, title: true },
    });

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const application = await prisma.rentalApplication.create({
      data: {
        applicationNumber,
        propertyId: property.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : null,
        currentAddress: data.currentAddress,
        currentCity: data.currentCity,
        currentState: data.currentState,
        currentZip: data.currentZip,
        monthlyRent: data.monthlyRent || null,
        moveInDate: new Date(data.moveInDate),
        employer: data.employer || null,
        jobTitle: data.jobTitle || null,
        monthlyIncome: data.monthlyIncome || null,
        employmentLength: data.employmentLength || null,
        landlordName: data.landlordName || null,
        landlordPhone: data.landlordPhone || null,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        numberOfOccupants: parseInt(data.numberOfOccupants, 10),
        hasPets: data.hasPets,
        petDescription: data.petDescription || null,
        additionalNotes: data.additionalNotes || null,
        consentBackground: data.consentBackground,
        consentTerms: data.consentTerms,
      },
    });

    // Send email notifications (fire-and-forget, don't block the response)
    const propertyTitle = property.title;
    const applicantName = `${data.firstName} ${data.lastName}`;

    Promise.allSettled([
      sendApplicationConfirmation({
        to: data.email,
        applicantName,
        applicationNumber,
        propertyTitle,
      }),
      sendAdminNewApplicationNotification({
        applicationNumber,
        applicantName,
        propertyTitle,
      }),
    ]).then((results) => {
      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(`Email notification ${i} failed:`, result.reason);
        }
      });
    });

    return NextResponse.json(
      {
        applicationNumber: application.applicationNumber,
        status: application.status,
        message: "Application submitted successfully",
        submittedAt: application.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json(
      { message: "Failed to submit application" },
      { status: 500 }
    );
  }
}
