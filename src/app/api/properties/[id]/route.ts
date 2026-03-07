import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { propertyUpdateSchema } from "@/validations/property";
import { createClient } from "@/lib/supabase/server";
import { apiHandler } from "@/lib/api-handler";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return apiHandler("GET /api/properties/[id]", async () => {
    const { id } = await context.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
        category: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property);
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return apiHandler("PATCH /api/properties/[id]", async () => {
    await requireAdmin();
    const { id } = await context.params;

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = propertyUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amenityIds, categoryId, ...updateData } = parsed.data;

    const cleanedData: Record<string, unknown> = { ...updateData };
    const nullableStringFields = ["addressLine2", "petPolicy", "metaTitle", "metaDescription"];
    for (const field of nullableStringFields) {
      if (field in cleanedData && cleanedData[field] === "") {
        cleanedData[field] = null;
      }
    }

    if (categoryId !== undefined) {
      cleanedData.categoryId = categoryId || null;
    }

    if (cleanedData.leaseTermType === undefined && "leaseTermType" in body) {
      cleanedData.leaseTermType = null;
    }

    const property = await prisma.$transaction(async (tx) => {
      if (amenityIds !== undefined) {
        await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
        if (amenityIds.length > 0) {
          await tx.propertyAmenity.createMany({
            data: amenityIds.map((amenityId) => ({ propertyId: id, amenityId })),
          });
        }
      }

      return tx.property.update({
        where: { id },
        data: cleanedData,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          amenities: { include: { amenity: true } },
          category: true,
        },
      });
    });

    return NextResponse.json(property);
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return apiHandler("DELETE /api/properties/[id]", async () => {
    await requireAdmin();
    const { id } = await context.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    if (property.images.length > 0) {
      try {
        const supabase = await createClient();
        await supabase.storage
          .from("property-images")
          .remove(property.images.map((img) => img.storagePath));
      } catch (storageError) {
        console.error("Failed to clean up storage images:", storageError);
      }
    }

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ message: "Property deleted successfully" });
  });
}
