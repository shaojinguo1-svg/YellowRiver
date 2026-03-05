"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { ApplicationInput } from "@/validations/application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { US_STATES } from "@/lib/constants";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";

interface CurrentAddressStepProps {
  register: UseFormRegister<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
  setValue: UseFormSetValue<ApplicationInput>;
  watch: UseFormWatch<ApplicationInput>;
}

export function CurrentAddressStep({
  register,
  errors,
  setValue,
  watch,
}: CurrentAddressStepProps) {
  const currentState = watch("currentState");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Current Address
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Where do you currently live?
        </p>
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="currentAddress">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="currentAddress"
          placeholder="123 Main St, Apt 4B"
          {...register("currentAddress")}
          aria-invalid={!!errors.currentAddress}
        />
        {errors.currentAddress && (
          <p className="text-sm text-destructive">
            {errors.currentAddress.message}
          </p>
        )}
      </div>

      {/* City, State, ZIP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="currentCity">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currentCity"
            placeholder="Austin"
            {...register("currentCity")}
            aria-invalid={!!errors.currentCity}
          />
          {errors.currentCity && (
            <p className="text-sm text-destructive">
              {errors.currentCity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentState">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={currentState || ""}
            onValueChange={(value) =>
              setValue("currentState", value, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.currentState}>
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
          {errors.currentState && (
            <p className="text-sm text-destructive">
              {errors.currentState.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentZip">
            ZIP Code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currentZip"
            placeholder="78701"
            maxLength={5}
            {...register("currentZip")}
            aria-invalid={!!errors.currentZip}
          />
          {errors.currentZip && (
            <p className="text-sm text-destructive">
              {errors.currentZip.message}
            </p>
          )}
        </div>
      </div>

      {/* Monthly Rent */}
      <div className="space-y-2">
        <Label htmlFor="monthlyRent">Current Monthly Rent</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id="monthlyRent"
            type="number"
            placeholder="1500"
            min="0"
            step="1"
            className="pl-7"
            {...register("monthlyRent")}
            aria-invalid={!!errors.monthlyRent}
          />
        </div>
        {errors.monthlyRent && (
          <p className="text-sm text-destructive">
            {errors.monthlyRent.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Leave blank if you own your current home or have no rent.
        </p>
      </div>

      {/* Move-in Date */}
      <div className="space-y-2">
        <Label htmlFor="moveInDate">
          Desired Move-in Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="moveInDate"
          type="date"
          {...register("moveInDate")}
          aria-invalid={!!errors.moveInDate}
        />
        {errors.moveInDate && (
          <p className="text-sm text-destructive">
            {errors.moveInDate.message}
          </p>
        )}
      </div>
    </div>
  );
}
