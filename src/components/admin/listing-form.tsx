"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { PropertyImageData } from "@/components/admin/image-upload";
import { propertyCreateSchema } from "@/validations/property";
import type { PropertyCreateInput } from "@/validations/property";

// Tab components — each uses useFormContext() internally
import { BasicInfoTab } from "@/components/admin/listing-form/basic-info-tab";
import { PricingTab } from "@/components/admin/listing-form/pricing-tab";
import { LocationTab } from "@/components/admin/listing-form/location-tab";
import { DetailsTab } from "@/components/admin/listing-form/details-tab";
import { ImagesTab } from "@/components/admin/listing-form/images-tab";
import { SeoTab } from "@/components/admin/listing-form/seo-tab";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AmenityOption {
  id: string;
  name: string;
  category: string | null;
}

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: Partial<PropertyCreateInput> & {
    id?: string;
    images?: PropertyImageData[];
  };
  availableAmenities?: AmenityOption[];
}

export function ListingForm({ mode, initialData, availableAmenities = [] }: ListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<PropertyCreateInput>({
    resolver: zodResolver(propertyCreateSchema) as never,
    defaultValues: {
      title:            initialData?.title          ?? "",
      description:      initialData?.description    ?? "",
      propertyType:     initialData?.propertyType   ?? undefined,
      listingType:      initialData?.listingType     ?? "RENT",
      status:           initialData?.status          ?? "DRAFT",
      price:            initialData?.price           ?? undefined,
      securityDeposit:  initialData?.securityDeposit ?? undefined,
      applicationFee:   initialData?.applicationFee  ?? undefined,
      addressLine1:     initialData?.addressLine1    ?? "",
      addressLine2:     initialData?.addressLine2    ?? "",
      city:             initialData?.city            ?? "",
      state:            initialData?.state           ?? "",
      zipCode:          initialData?.zipCode         ?? "",
      bedrooms:         initialData?.bedrooms        ?? undefined,
      bathrooms:        initialData?.bathrooms       ?? undefined,
      squareFeet:       initialData?.squareFeet      ?? undefined,
      yearBuilt:        initialData?.yearBuilt       ?? undefined,
      floor:            initialData?.floor           ?? undefined,
      totalFloors:      initialData?.totalFloors     ?? undefined,
      parkingSpaces:    initialData?.parkingSpaces   ?? 0,
      petPolicy:        initialData?.petPolicy       ?? "",
      leaseTermType:    initialData?.leaseTermType   ?? undefined,
      availableFrom:    initialData?.availableFrom
                          ? new Date(initialData.availableFrom)
                          : undefined,
      metaTitle:        initialData?.metaTitle       ?? "",
      metaDescription:  initialData?.metaDescription ?? "",
      categoryId:       initialData?.categoryId      ?? "",
      amenityIds:       initialData?.amenityIds      ?? [],
    },
  });

  async function onSubmit(data: PropertyCreateInput) {
    setIsSubmitting(true);
    try {
      const url    = mode === "create" ? "/api/properties" : `/api/properties/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Something went wrong");
      }

      toast.success(
        mode === "create" ? "Listing created successfully" : "Listing updated successfully"
      );
      router.push("/admin/listings");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingTab initialAvailableFrom={initialData?.availableFrom} />
          </TabsContent>

          <TabsContent value="location">
            <LocationTab />
          </TabsContent>

          <TabsContent value="details">
            <DetailsTab availableAmenities={availableAmenities} />
          </TabsContent>

          <TabsContent value="images">
            <ImagesTab
              mode={mode}
              propertyId={initialData?.id}
              initialImages={initialData?.images}
            />
          </TabsContent>

          <TabsContent value="seo">
            <SeoTab />
          </TabsContent>
        </Tabs>

        {/* Submit / Cancel */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {mode === "create" ? "Create Listing" : "Update Listing"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/listings">Cancel</Link>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
