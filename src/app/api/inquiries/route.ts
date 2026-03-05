import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/auth";
import { inquirySchema } from "@/validations/inquiry";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [inquiries, total] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        include: {
          user: {
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
      prisma.contactInquiry.count({ where }),
    ]);

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/inquiries error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Optionally link to the authenticated user
    const user = await getCurrentUser();

    // Check if a propertyId was sent along
    const propertyId = body.propertyId || null;

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        propertyId,
        userId: user?.id ?? null,
      },
    });

    return NextResponse.json(
      { message: "Inquiry submitted successfully", inquiry },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inquiries error:", error);
    return NextResponse.json(
      { message: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
