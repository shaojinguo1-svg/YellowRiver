"use client";

import { useFormContext } from "react-hook-form";
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
  PROPERTY_TYPES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
} from "@/lib/constants";
import type { PropertyCreateInput } from "@/validations/property";

export function BasicInfoTab() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<PropertyCreateInput>();

  return (
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
            <p className="text-sm text-destructive">{errors.title.message}</p>
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
            <p className="text-sm text-destructive">{errors.description.message}</p>
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
              <p className="text-sm text-destructive">{errors.propertyType.message}</p>
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
              <p className="text-sm text-destructive">{errors.listingType.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watch("status")}
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
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
