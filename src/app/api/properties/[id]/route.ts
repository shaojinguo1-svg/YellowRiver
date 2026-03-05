import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { propertyUpdateSchema } from "@/validations/property";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
        category: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error("GET /api/properties/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    // Verify property exists
    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
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

    // Clean up optional empty strings to null for DB
    const cleanedData: Record<string, unknown> = { ...updateData };
    const nullableStringFields = [
      "addressLine2",
      "petPolicy",
      "metaTitle",
      "metaDescription",
    ];
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

    // Update property and amenities in a transaction
    const property = await prisma.$transaction(async (tx) => {
      // Update amenities if provided
      if (amenityIds !== undefined) {
        // Remove existing amenities
        await tx.propertyAmenity.deleteMany({
          where: { propertyId: id },
        });

        // Add new amenities
        if (amenityIds.length > 0) {
          await tx.propertyAmenity.createMany({
            data: amenityIds.map((amenityId) => ({
              propertyId: id,
              amenityId,
            })),
          });
        }
      }

      // Update property
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
  } catch (error) {
    console.error("PATCH /api/properties/[id] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    // Verify property exists and get image storage paths
    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    // Clean up images from Supabase Storage
    if (property.images.length > 0) {
      try {
        const supabase = await createClient();
        const storagePaths = property.images.map((img) => img.storagePath);
        await supabase.storage
          .from("property-images")
          .remove(storagePaths);
      } catch (storageError) {
        // Log but don't fail the delete if storage cleanup fails
        console.error("Failed to clean up storage images:", storageError);
      }
    }

    // Delete property (cascades to images and amenities)
    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/properties/[id] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to delete property" },
      { status: 500 }
    );
  }
}
