import { ListingForm } from "@/components/admin/listing-form";

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Create New Listing</h2>
        <p className="text-sm text-muted-foreground">
          Add a new property listing to the site
        </p>
      </div>

      <ListingForm mode="create" />
    </div>
  );
}
