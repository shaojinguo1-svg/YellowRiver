import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH - Reorder images for a property
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const body = await request.json();
    const { imageIds } = body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { message: "imageIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Verify all images belong to this property
    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      select: { id: true },
    });

    const existingIds = new Set(images.map((img) => img.id));
    for (const imgId of imageIds) {
      if (!existingIds.has(imgId)) {
        return NextResponse.json(
          { message: `Image ${imgId} does not belong to this property` },
          { status: 400 }
        );
      }
    }

    // Update sortOrder for each image in a transaction
    await prisma.$transaction(
      imageIds.map((imageId: string, index: number) =>
        prisma.propertyImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ message: "Images reordered" });
  } catch (error) {
    console.error("PATCH /api/properties/[id]/images/reorder error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to reorder images" },
      { status: 500 }
    );
  }
}
