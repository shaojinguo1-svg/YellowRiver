"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEASE_TERMS } from "@/lib/constants";
import type { PropertyCreateInput } from "@/validations/property";

interface PricingTabProps {
  initialAvailableFrom?: Date | string;
}

export function PricingTab({ initialAvailableFrom }: PricingTabProps) {
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
              <p className="text-sm text-destructive">{errors.price.message}</p>
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
              <p className="text-sm text-destructive">{errors.securityDeposit.message}</p>
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
              <p className="text-sm text-destructive">{errors.applicationFee.message}</p>
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
                setValue("leaseTermType", value as PropertyCreateInput["leaseTermType"], {
                  shouldValidate: true,
                })
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
              <p className="text-sm text-destructive">{errors.leaseTermType.message}</p>
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
                initialAvailableFrom
                  ? format(new Date(initialAvailableFrom), "yyyy-MM-dd")
                  : ""
              }
            />
            {errors.availableFrom && (
              <p className="text-sm text-destructive">{errors.availableFrom.message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
