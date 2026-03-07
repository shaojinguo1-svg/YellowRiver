"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PropertyCreateInput } from "@/validations/property";

interface AmenityOption {
  id: string;
  name: string;
  category: string | null;
}

interface DetailsTabProps {
  availableAmenities?: AmenityOption[];
}

export function DetailsTab({ availableAmenities = [] }: DetailsTabProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PropertyCreateInput>();

  return (
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
              <p className="text-sm text-destructive">{errors.bedrooms.message}</p>
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
              <p className="text-sm text-destructive">{errors.bathrooms.message}</p>
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
              <p className="text-sm text-destructive">{errors.squareFeet.message}</p>
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
              <p className="text-sm text-destructive">{errors.yearBuilt.message}</p>
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
              <p className="text-sm text-destructive">{errors.floor.message}</p>
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
              <p className="text-sm text-destructive">{errors.totalFloors.message}</p>
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
              <p className="text-sm text-destructive">{errors.parkingSpaces.message}</p>
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
            <p className="text-sm text-destructive">{errors.petPolicy.message}</p>
          )}
        </div>

        {/* Amenities */}
        {availableAmenities.length > 0 && (
          <div className="space-y-3">
            <Label>Amenities</Label>
            <p className="text-xs text-muted-foreground">
              Select all amenities that apply to this property
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {availableAmenities.map((amenity) => {
                const currentIds = watch("amenityIds") ?? [];
                const isChecked = currentIds.includes(amenity.id);
                return (
                  <label
                    key={amenity.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isChecked
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-muted hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...currentIds, amenity.id]
                          : currentIds.filter((id: string) => id !== amenity.id);
                        setValue("amenityIds", updated, { shouldDirty: true });
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                        isChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="size-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{amenity.name}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {(watch("amenityIds") ?? []).length} selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
