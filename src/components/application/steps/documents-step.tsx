"use client";

import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { ApplicationInput } from "@/validations/application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload } from "lucide-react";

interface DocumentsStepProps {
  register: UseFormRegister<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
  watch: UseFormWatch<ApplicationInput>;
  setValue: UseFormSetValue<ApplicationInput>;
}

function FileUploadZone({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}{" "}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center transition-colors hover:border-muted-foreground/40 hover:bg-muted/50">
        <Upload className="size-8 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Drag & drop or click to upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            PDF, JPG, PNG up to 10MB
          </p>
        </div>
      </div>
    </div>
  );
}

export function DocumentsStep({
  register,
  errors,
  watch,
  setValue,
}: DocumentsStepProps) {
  const hasPets = watch("hasPets");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Documents & Additional Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide additional details about your household and upload required
          documents.
        </p>
      </div>

      {/* Number of Occupants */}
      <div className="space-y-2">
        <Label htmlFor="numberOfOccupants">
          Number of Occupants <span className="text-destructive">*</span>
        </Label>
        <Input
          id="numberOfOccupants"
          type="number"
          min="1"
          step="1"
          placeholder="1"
          {...register("numberOfOccupants")}
          aria-invalid={!!errors.numberOfOccupants}
        />
        {errors.numberOfOccupants && (
          <p className="text-sm text-destructive">
            {errors.numberOfOccupants.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Total number of people who will live in the unit, including yourself.
        </p>
      </div>

      {/* Has Pets */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="hasPets"
            checked={hasPets || false}
            onCheckedChange={(checked) =>
              setValue("hasPets", checked === true, { shouldValidate: true })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="hasPets" className="cursor-pointer">
              I have pets
            </Label>
            <p className="text-xs text-muted-foreground">
              Check this box if you have any pets that will live with you.
            </p>
          </div>
        </div>

        {hasPets && (
          <div className="ml-7 space-y-2">
            <Label htmlFor="petDescription">
              Pet Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="petDescription"
              placeholder="e.g., 1 golden retriever (45 lbs), 1 domestic shorthair cat"
              rows={3}
              {...register("petDescription")}
              aria-invalid={!!errors.petDescription}
            />
            {errors.petDescription && (
              <p className="text-sm text-destructive">
                {errors.petDescription.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Any additional information you'd like to share..."
          rows={4}
          {...register("additionalNotes")}
          aria-invalid={!!errors.additionalNotes}
        />
        {errors.additionalNotes && (
          <p className="text-sm text-destructive">
            {errors.additionalNotes.message}
          </p>
        )}
      </div>

      {/* File Upload Areas */}
      <div className="space-y-6">
        <div className="border-b pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Required Documents
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FileUploadZone label="Government ID" required />
          <FileUploadZone label="Proof of Income" required />
        </div>

        <FileUploadZone label="Additional Documents" />

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            File upload will be connected after database setup. For now, you may
            proceed without uploading documents.
          </p>
        </div>
      </div>
    </div>
  );
}
