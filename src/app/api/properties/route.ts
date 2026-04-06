import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { propertyCreateSchema } from "@/validations/property";
import { apiHandler } from "@/lib/api-handler";
import type { Prisma, PropertyStatus, PropertyType } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  return apiHandler("GET /api/properties", async () => {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12));
    const status = searchParams.get("status");
    const propertyType = searchParams.get("propertyType");
    const city = searchParams.get("city");
    const search = searchParams.get("search");
    const skip = (page - 1) * limit;

    const VALID_STATUSES: PropertyStatus[] = ["DRAFT", "ACTIVE", "RENTED", "INACTIVE", "ARCHIVED"];
    const VALID_PROPERTY_TYPES: PropertyType[] = ["APARTMENT", "HOUSE", "CONDO", "TOWNHOUSE", "STUDIO"];

    const where: Prisma.PropertyWhereInput = {};

    const adminMode = searchParams.get("admin") === "true";
    if (adminMode) {
      const user = await getCurrentUser();
      if (user?.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if (status) {
        if (!VALID_STATUSES.includes(status as PropertyStatus)) {
          return NextResponse.json({ message: `Invalid status: ${status}` }, { status: 400 });
        }
        where.status = status as Prisma.EnumPropertyStatusFilter;
      }
    } else {
      where.status = "ACTIVE";
    }

    if (propertyType) {
      if (!VALID_PROPERTY_TYPES.includes(propertyType as PropertyType)) {
        return NextResponse.json({ message: `Invalid propertyType: ${propertyType}` }, { status: 400 });
      }
      where.propertyType = propertyType as Prisma.EnumPropertyTypeFilter;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { addressLine1: { contains: search, mode: "insensitive" } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return apiHandler("POST /api/properties", async () => {
    const admin = await requireAdmin();

    const body = await request.json();
    const parsed = propertyCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const baseSlug = slugify(`${data.title} ${data.city}`, {
      lower: true,
      strict: true,
    });

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { amenityIds, categoryId, ...propertyData } = data;

    const property = await prisma.property.create({
      data: {
        ...propertyData,
        slug,
        price: propertyData.price,
        securityDeposit: propertyData.securityDeposit ?? null,
        applicationFee: propertyData.applicationFee ?? null,
        addressLine2: propertyData.addressLine2 || null,
        petPolicy: propertyData.petPolicy || null,
        metaTitle: propertyData.metaTitle || null,
        metaDescription: propertyData.metaDescription || null,
        leaseTermType: propertyData.leaseTermType ?? null,
        categoryId: categoryId || null,
        createdById: admin.id,
        amenities:
          amenityIds && amenityIds.length > 0
            ? { create: amenityIds.map((amenityId) => ({ amenityId })) }
            : undefined,
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
        category: true,
      },
    });

    return NextResponse.json(property, { status: 201 });
  });
}
