"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { ImageUpload } from "@/components/admin/image-upload";
import type { PropertyImageData } from "@/components/admin/image-upload";
import { propertyCreateSchema } from "@/validations/property";
import type { PropertyCreateInput, PropertyCreateFormInput } from "@/validations/property";
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  LEASE_TERMS,
  PROPERTY_STATUSES,
  US_STATES,
} from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: Partial<PropertyCreateInput> & {
    id?: string;
    images?: PropertyImageData[];
  };
}

export function ListingForm({ mode, initialData }: ListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyCreateInput>({
    resolver: zodResolver(propertyCreateSchema) as never,
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      propertyType: initialData?.propertyType ?? undefined,
      listingType: initialData?.listingType ?? "RENT",
      status: initialData?.status ?? "DRAFT",
      price: initialData?.price ?? undefined,
      securityDeposit: initialData?.securityDeposit ?? undefined,
      applicationFee: initialData?.applicationFee ?? undefined,
      addressLine1: initialData?.addressLine1 ?? "",
      addressLine2: initialData?.addressLine2 ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "",
      zipCode: initialData?.zipCode ?? "",
      bedrooms: initialData?.bedrooms ?? undefined,
      bathrooms: initialData?.bathrooms ?? undefined,
      squareFeet: initialData?.squareFeet ?? undefined,
      yearBuilt: initialData?.yearBuilt ?? undefined,
      floor: initialData?.floor ?? undefined,
      totalFloors: initialData?.totalFloors ?? undefined,
      parkingSpaces: initialData?.parkingSpaces ?? 0,
      petPolicy: initialData?.petPolicy ?? "",
      leaseTermType: initialData?.leaseTermType ?? undefined,
      availableFrom: initialData?.availableFrom
        ? new Date(initialData.availableFrom)
        : undefined,
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
      categoryId: initialData?.categoryId ?? "",
      amenityIds: initialData?.amenityIds ?? [],
    },
  });

  const watchedStatus = watch("status");

  async function onSubmit(data: PropertyCreateInput) {
    setIsSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/properties"
          : `/api/properties/${initialData?.id}`;
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
        mode === "create"
          ? "Listing created successfully"
          : "Listing updated successfully"
      );
      router.push("/admin/listings");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Basic Info ─────────────────────────────── */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Modern 2-Bedroom Apartment in Downtown"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the property..."
                  rows={6}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Property Type */}
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select
                    value={watch("propertyType")}
                    onValueChange={(value) =>
                      setValue("propertyType", value as PropertyCreateInput["propertyType"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.propertyType && (
                    <p className="text-sm text-destructive">
                      {errors.propertyType.message}
                    </p>
                  )}
                </div>

                {/* Listing Type */}
                <div className="space-y-2">
                  <Label>Listing Type *</Label>
                  <Select
                    value={watch("listingType")}
                    onValueChange={(value) =>
                      setValue("listingType", value as PropertyCreateInput["listingType"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select listing type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.listingType && (
                    <p className="text-sm text-destructive">
                      {errors.listingType.message}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={watchedStatus}
                    onValueChange={(value) =>
                      setValue("status", value as PropertyCreateInput["status"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_STATUSES.filter(
                        (s) => s.value === "DRAFT" || s.value === "ACTIVE"
                      ).map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Pricing ────────────────────────────────── */}
        <TabsContent value="pricing">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent / Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                {/* Security Deposit */}
                <div className="space-y-2">
                  <Label htmlFor="securityDeposit">Security Deposit</Label>
                  <Input
                    id="securityDeposit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("securityDeposit", { valueAsNumber: true })}
                  />
                  {errors.securityDeposit && (
                    <p className="text-sm text-destructive">
                      {errors.securityDeposit.message}
                    </p>
                  )}
                </div>

                {/* Application Fee */}
                <div className="space-y-2">
                  <Label htmlFor="applicationFee">Application Fee</Label>
                  <Input
                    id="applicationFee"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("applicationFee", { valueAsNumber: true })}
                  />
                  {errors.applicationFee && (
                    <p className="text-sm text-destructive">
                      {errors.applicationFee.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Lease Term */}
                <div className="space-y-2">
                  <Label>Lease Term</Label>
                  <Select
                    value={watch("leaseTermType") ?? ""}
                    onValueChange={(value) =>
                      setValue(
                        "leaseTermType",
                        value as PropertyCreateInput["leaseTermType"],
                        { shouldValidate: true }
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select lease term" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEASE_TERMS.map((term) => (
                        <SelectItem key={term.value} value={term.value}>
                          {term.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.leaseTermType && (
                    <p className="text-sm text-destructive">
                      {errors.leaseTermType.message}
                    </p>
                  )}
                </div>

                {/* Available From */}
                <div className="space-y-2">
                  <Label htmlFor="availableFrom">Available From *</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    {...register("availableFrom")}
                    defaultValue={
                      initialData?.availableFrom
                        ? format(new Date(initialData.availableFrom), "yyyy-MM-dd")
                        : ""
                    }
                  />
                  {errors.availableFrom && (
                    <p className="text-sm text-destructive">
                      {errors.availableFrom.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Location ───────────────────────────────── */}
        <TabsContent value="location">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Address Line 1 */}
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  placeholder="123 Main Street"
                  {...register("addressLine1")}
                />
                {errors.addressLine1 && (
                  <p className="text-sm text-destructive">
                    {errors.addressLine1.message}
                  </p>
                )}
              </div>

              {/* Address Line 2 */}
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apt 4B"
                  {...register("addressLine2")}
                />
                {errors.addressLine2 && (
                  <p className="text-sm text-destructive">
                    {errors.addressLine2.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select
                    value={watch("state")}
                    onValueChange={(value) =>
                      setValue("state", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="text-sm text-destructive">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                {/* Zip Code */}
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="94102"
                    maxLength={5}
                    {...register("zipCode")}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-destructive">
                      {errors.zipCode.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Details ────────────────────────────────── */}
        <TabsContent value="details">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Bedrooms */}
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={0}
                    max={20}
                    placeholder="0"
                    {...register("bedrooms", { valueAsNumber: true })}
                  />
                  {errors.bedrooms && (
                    <p className="text-sm text-destructive">
                      {errors.bedrooms.message}
                    </p>
                  )}
                </div>

                {/* Bathrooms */}
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min={0.5}
                    max={20}
                    step={0.5}
                    placeholder="1"
                    {...register("bathrooms", { valueAsNumber: true })}
                  />
                  {errors.bathrooms && (
                    <p className="text-sm text-destructive">
                      {errors.bathrooms.message}
                    </p>
                  )}
                </div>

                {/* Square Feet */}
                <div className="space-y-2">
                  <Label htmlFor="squareFeet">Square Feet</Label>
                  <Input
                    id="squareFeet"
                    type="number"
                    min={1}
                    placeholder="0"
                    {...register("squareFeet", { valueAsNumber: true })}
                  />
                  {errors.squareFeet && (
                    <p className="text-sm text-destructive">
                      {errors.squareFeet.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                {/* Year Built */}
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    placeholder="2020"
                    {...register("yearBuilt", { valueAsNumber: true })}
                  />
                  {errors.yearBuilt && (
                    <p className="text-sm text-destructive">
                      {errors.yearBuilt.message}
                    </p>
                  )}
                </div>

                {/* Floor */}
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    type="number"
                    placeholder="1"
                    {...register("floor", { valueAsNumber: true })}
                  />
                  {errors.floor && (
                    <p className="text-sm text-destructive">
                      {errors.floor.message}
                    </p>
                  )}
                </div>

                {/* Total Floors */}
                <div className="space-y-2">
                  <Label htmlFor="totalFloors">Total Floors</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    placeholder="1"
                    {...register("totalFloors", { valueAsNumber: true })}
                  />
                  {errors.totalFloors && (
                    <p className="text-sm text-destructive">
                      {errors.totalFloors.message}
                    </p>
                  )}
                </div>

                {/* Parking Spaces */}
                <div className="space-y-2">
                  <Label htmlFor="parkingSpaces">Parking Spaces</Label>
                  <Input
                    id="parkingSpaces"
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register("parkingSpaces", { valueAsNumber: true })}
                  />
                  {errors.parkingSpaces && (
                    <p className="text-sm text-destructive">
                      {errors.parkingSpaces.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Pet Policy */}
              <div className="space-y-2">
                <Label htmlFor="petPolicy">Pet Policy</Label>
                <Textarea
                  id="petPolicy"
                  placeholder="e.g. Small dogs and cats allowed with a $500 pet deposit"
                  rows={3}
                  {...register("petPolicy")}
                />
                {errors.petPolicy && (
                  <p className="text-sm text-destructive">
                    {errors.petPolicy.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Images ─────────────────────────────────── */}
        <TabsContent value="images">
          <Card>
            <CardContent className="pt-6">
              {mode === "edit" && initialData?.id ? (
                <ImageUpload
                  propertyId={initialData.id}
                  initialImages={initialData.images ?? []}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Save the listing first, then you can upload images.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 6: SEO ────────────────────────────────────── */}
        <TabsContent value="seo">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Meta Title */}
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO-friendly title (max 60 characters)"
                  maxLength={60}
                  {...register("metaTitle")}
                />
                <p className="text-xs text-muted-foreground">
                  {(watch("metaTitle") ?? "").length}/60 characters
                </p>
                {errors.metaTitle && (
                  <p className="text-sm text-destructive">
                    {errors.metaTitle.message}
                  </p>
                )}
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Brief SEO description (max 160 characters)"
                  maxLength={160}
                  rows={3}
                  {...register("metaDescription")}
                />
                <p className="text-xs text-muted-foreground">
                  {(watch("metaDescription") ?? "").length}/160 characters
                </p>
                {errors.metaDescription && (
                  <p className="text-sm text-destructive">
                    {errors.metaDescription.message}
                  </p>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Submit / Cancel ───────────────────────────────── */}
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
  );
}
