import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - List all images for a property
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("GET /api/properties/[id]/images error:", error);
    return NextResponse.json(
      { message: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST - Add a new image record for a property
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    // Verify property exists
    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { url, storagePath, alt, sortOrder, isPrimary } = body;

    if (!url || !storagePath) {
      return NextResponse.json(
        { message: "Missing required fields: url, storagePath" },
        { status: 400 }
      );
    }

    // If this image is set as primary, unset all others first
    if (isPrimary) {
      await prisma.propertyImage.updateMany({
        where: { propertyId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.propertyImage.create({
      data: {
        propertyId: id,
        url,
        storagePath,
        alt: alt || null,
        sortOrder: sortOrder ?? 0,
        isPrimary: isPrimary ?? false,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("POST /api/properties/[id]/images error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to add image" },
      { status: 500 }
    );
  }
}
