import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/auth";
import { inquirySchema } from "@/validations/inquiry";
import { apiHandler } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  logEmailDeliveryResult,
  sendAdminContactInquiryNotification,
} from "@/lib/email";

export async function GET(request: NextRequest) {
  return apiHandler("GET /api/inquiries", async () => {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.contactInquiry.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}

export async function POST(request: NextRequest) {
  return apiHandler("POST /api/inquiries", async () => {
    const limited = checkRateLimit(request, {
      keyPrefix: "inquiry-submit",
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (limited.limited) {
      return rateLimitResponse(limited.retryAfter);
    }

    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const user = await getCurrentUser();

    let propertyId: string | null = null;
    if (body.propertyId && typeof body.propertyId === "string") {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(body.propertyId)) {
        return NextResponse.json({ message: "Invalid property ID format" }, { status: 400 });
      }
      const property = await prisma.property.findFirst({
        where: { id: body.propertyId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!property) {
        return NextResponse.json({ message: "Invalid property" }, { status: 400 });
      }
      propertyId = property.id;
    }

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

    void sendAdminContactInquiryNotification({
      inquiryId: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      subject: inquiry.subject,
      message: inquiry.message,
      propertyId: inquiry.propertyId,
    }).then(logEmailDeliveryResult);

    return NextResponse.json(
      { message: "Inquiry submitted successfully", inquiry },
      { status: 201 }
    );
  });
}
