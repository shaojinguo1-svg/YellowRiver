import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PROPERTY_IMAGES_BUCKET = "property-images";

async function storageObjectExists(storagePath: string) {
  const lastSlash = storagePath.lastIndexOf("/");
  const folder = lastSlash >= 0 ? storagePath.slice(0, lastSlash) : "";
  const name = lastSlash >= 0 ? storagePath.slice(lastSlash + 1) : storagePath;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .list(folder, { limit: 20, search: name });

  if (error) {
    throw new Error(error.message);
  }

  return data?.some((item) => item.name === name) ?? false;
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
    const { storagePath, alt, sortOrder, isPrimary } = body;

    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json(
        { message: "Missing required field: storagePath" },
        { status: 400 }
      );
    }

    if (
      storagePath.includes("..") ||
      storagePath.startsWith("/") ||
      !storagePath.startsWith(`${id}/`)
    ) {
      return NextResponse.json(
        { message: "Image path does not belong to this property" },
        { status: 400 }
      );
    }

    const exists = await storageObjectExists(storagePath);
    if (!exists) {
      return NextResponse.json(
        { message: "Uploaded image was not found" },
        { status: 400 }
      );
    }

    const {
      data: { publicUrl },
    } = createServiceRoleClient().storage
      .from(PROPERTY_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

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
        url: publicUrl,
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
