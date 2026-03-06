import { ListingForm } from "@/components/admin/listing-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
      category: true,
    },
  });

  if (!property) {
    notFound();
  }

  // Transform Prisma data into form-compatible format
  const initialData = {
    id: property.id,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    listingType: property.listingType,
    status: property.status as "DRAFT" | "ACTIVE",
    price: Number(property.price),
    securityDeposit: property.securityDeposit
      ? Number(property.securityDeposit)
      : undefined,
    applicationFee: property.applicationFee
      ? Number(property.applicationFee)
      : undefined,
    addressLine1: property.addressLine1,
    addressLine2: property.addressLine2 ?? "",
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    bedrooms: property.bedrooms,
    bathrooms: Number(property.bathrooms),
    squareFeet: property.squareFeet ?? undefined,
    yearBuilt: property.yearBuilt ?? undefined,
    floor: property.floor ?? undefined,
    totalFloors: property.totalFloors ?? undefined,
    parkingSpaces: property.parkingSpaces,
    petPolicy: property.petPolicy ?? "",
    leaseTermType: property.leaseTermType ?? undefined,
    availableFrom: property.availableFrom,
    metaTitle: property.metaTitle ?? "",
    metaDescription: property.metaDescription ?? "",
    featured: property.featured,
    categoryId: property.categoryId ?? "",
    amenityIds: property.amenities.map((pa) => pa.amenityId),
    images: property.images.map((img) => ({
      id: img.id,
      url: img.url,
      storagePath: img.storagePath,
      alt: img.alt,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
  };

  const amenities = await prisma.amenity.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Edit Listing</h2>
        <p className="text-sm text-muted-foreground">
          Update the property listing details
        </p>
      </div>

      <ListingForm mode="edit" initialData={initialData} availableAmenities={amenities} />
    </div>
  );
}
