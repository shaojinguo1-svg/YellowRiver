import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

// PATCH - Update an image (alt text, isPrimary)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, imageId } = await context.params;

    const image = await prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId: id },
    });

    if (!image) {
      return NextResponse.json(
        { message: "Image not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.alt !== undefined) {
      updateData.alt = body.alt || null;
    }

    if (body.isPrimary !== undefined) {
      updateData.isPrimary = body.isPrimary;
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (body.isPrimary) {
        await tx.propertyImage.updateMany({
          where: { propertyId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.propertyImage.update({
        where: { id: imageId },
        data: updateData,
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/properties/[id]/images/[imageId] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update image" },
      { status: 500 }
    );
  }
}

// DELETE - Remove an image
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id, imageId } = await context.params;

    const image = await prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId: id },
    });

    if (!image) {
      return NextResponse.json(
        { message: "Image not found" },
        { status: 404 }
      );
    }

    // Delete from Supabase Storage
    try {
      const supabase = await createClient();
      await supabase.storage
        .from("property-images")
        .remove([image.storagePath]);
    } catch (storageError) {
      console.error("Failed to delete from storage:", storageError);
      // Continue with DB deletion even if storage cleanup fails
    }

    // Delete DB record
    await prisma.propertyImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ message: "Image deleted" });
  } catch (error) {
    console.error("DELETE /api/properties/[id]/images/[imageId] error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Failed to delete image" },
      { status: 500 }
    );
  }
}
