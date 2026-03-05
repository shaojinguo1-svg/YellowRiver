"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { ApplicationInput } from "@/validations/application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReferencesStepProps {
  register: UseFormRegister<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
}

export function ReferencesStep({ register, errors }: ReferencesStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">References</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide references to help us verify your rental history.
        </p>
      </div>

      {/* Current Landlord Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Current Landlord
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Optional, but helps speed up processing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="landlordName">Landlord Name</Label>
            <Input
              id="landlordName"
              placeholder="Jane Smith"
              {...register("landlordName")}
              aria-invalid={!!errors.landlordName}
            />
            {errors.landlordName && (
              <p className="text-sm text-destructive">
                {errors.landlordName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="landlordPhone">Landlord Phone</Label>
            <Input
              id="landlordPhone"
              type="tel"
              placeholder="(555) 987-6543"
              {...register("landlordPhone")}
              aria-invalid={!!errors.landlordPhone}
            />
            {errors.landlordPhone && (
              <p className="text-sm text-destructive">
                {errors.landlordPhone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Emergency Contact
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Required. Someone we can reach in case of an emergency.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">
              Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emergencyName"
              placeholder="Robert Doe"
              {...register("emergencyName")}
              aria-invalid={!!errors.emergencyName}
            />
            {errors.emergencyName && (
              <p className="text-sm text-destructive">
                {errors.emergencyName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">
              Contact Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="emergencyPhone"
              type="tel"
              placeholder="(555) 555-1234"
              {...register("emergencyPhone")}
              aria-invalid={!!errors.emergencyPhone}
            />
            {errors.emergencyPhone && (
              <p className="text-sm text-destructive">
                {errors.emergencyPhone.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
