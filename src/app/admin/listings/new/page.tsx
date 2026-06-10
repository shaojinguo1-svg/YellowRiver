import { ListingForm } from "@/components/admin/listing-form";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth";

export default async function NewListingPage() {
  await requireAdminPage();

  const amenities = await prisma.amenity.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Create New Listing</h2>
        <p className="text-sm text-muted-foreground">
          Add a new property listing to the site
        </p>
      </div>

      <ListingForm mode="create" availableAmenities={amenities} />
    </div>
  );
}
