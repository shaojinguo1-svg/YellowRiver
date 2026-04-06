"use client";

import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { ApplicationInput } from "@/validations/application";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { US_STATES } from "@/lib/constants";

interface ReviewStepProps {
  formData: Partial<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
  setValue: UseFormSetValue<ApplicationInput>;
  watch: UseFormWatch<ApplicationInput>;
}

function ReviewField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const displayValue =
    value === undefined || value === null || value === ""
      ? "Not provided"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);

  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${
          displayValue === "Not provided"
            ? "text-muted-foreground/50 italic"
            : "text-foreground"
        }`}
      >
        {displayValue}
      </span>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gold-dark">
          {title}
        </h3>
        <div className="space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ReviewStep({ formData, errors, setValue, watch }: ReviewStepProps) {
  const consentBackground = watch("consentBackground");
  const consentTerms = watch("consentTerms");

  const stateName = formData.currentState
    ? US_STATES.find((s) => s.value === formData.currentState)?.label ||
      formData.currentState
    : undefined;

  const employmentLengthLabels: Record<string, string> = {
    "less-than-1": "Less than 1 year",
    "1-2": "1-2 years",
    "3-5": "3-5 years",
    "5-plus": "5+ years",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Review Your Application
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review all the information below before submitting. You can go
          back to any step to make changes.
        </p>
      </div>

      {/* Personal Information */}
      <ReviewSection title="Personal Information">
        <ReviewField
          label="Full Name"
          value={
            formData.firstName || formData.lastName
              ? `${formData.firstName || ""} ${formData.lastName || ""}`.trim()
              : undefined
          }
        />
        <ReviewField label="Email" value={formData.email} />
        <ReviewField label="Phone" value={formData.phone} />
        <ReviewField label="Date of Birth" value={formData.dateOfBirth} />
      </ReviewSection>

      {/* Current Address */}
      <ReviewSection title="Current Address">
        <ReviewField label="Street Address" value={formData.currentAddress} />
        <ReviewField
          label="City, State, ZIP"
          value={
            formData.currentCity || stateName || formData.currentZip
              ? `${formData.currentCity || ""}, ${stateName || ""} ${formData.currentZip || ""}`.trim()
              : undefined
          }
        />
        <ReviewField
          label="Current Monthly Rent"
          value={
            formData.monthlyRent
              ? `$${Number(formData.monthlyRent).toLocaleString()}`
              : undefined
          }
        />
        <ReviewField label="Desired Move-in Date" value={formData.moveInDate} />
      </ReviewSection>

      {/* Employment */}
      <ReviewSection title="Employment">
        <ReviewField label="Employer" value={formData.employer} />
        <ReviewField label="Job Title" value={formData.jobTitle} />
        <ReviewField
          label="Monthly Income"
          value={
            formData.monthlyIncome
              ? `$${Number(formData.monthlyIncome).toLocaleString()}`
              : undefined
          }
        />
        <ReviewField
          label="Employment Length"
          value={
            formData.employmentLength
              ? employmentLengthLabels[formData.employmentLength] ||
                formData.employmentLength
              : undefined
          }
        />
      </ReviewSection>

      {/* References */}
      <ReviewSection title="References">
        <ReviewField label="Landlord Name" value={formData.landlordName} />
        <ReviewField label="Landlord Phone" value={formData.landlordPhone} />
        <ReviewField label="Emergency Contact" value={formData.emergencyName} />
        <ReviewField
          label="Emergency Phone"
          value={formData.emergencyPhone}
        />
      </ReviewSection>

      {/* Documents & Additional */}
      <ReviewSection title="Additional Details">
        <ReviewField
          label="Number of Occupants"
          value={formData.numberOfOccupants}
        />
        <ReviewField label="Has Pets" value={formData.hasPets} />
        {formData.hasPets && (
          <ReviewField
            label="Pet Description"
            value={formData.petDescription}
          />
        )}
        {formData.additionalNotes && (
          <ReviewField
            label="Additional Notes"
            value={formData.additionalNotes}
          />
        )}
      </ReviewSection>

      {/* Consent Checkboxes */}
      <Card>
        <CardContent className="space-y-5 p-4 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-dark">
            Consent & Agreement
          </h3>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentBackground"
              checked={consentBackground || false}
              onCheckedChange={(checked) =>
                setValue("consentBackground", checked === true, {
                  shouldValidate: true,
                })
              }
              aria-invalid={!!errors.consentBackground}
            />
            <div className="space-y-1">
              <Label htmlFor="consentBackground" className="cursor-pointer leading-snug">
                I consent to a background and credit check{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you authorize us to conduct a background
                and credit check as part of the application process.
              </p>
              {errors.consentBackground && (
                <p className="text-sm text-destructive">
                  {errors.consentBackground.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentTerms"
              checked={consentTerms || false}
              onCheckedChange={(checked) =>
                setValue("consentTerms", checked === true, {
                  shouldValidate: true,
                })
              }
              aria-invalid={!!errors.consentTerms}
            />
            <div className="space-y-1">
              <Label htmlFor="consentTerms" className="cursor-pointer leading-snug">
                I agree to the terms and conditions{" "}
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you confirm that all information provided
                is accurate and complete. You agree to our rental application
                terms and privacy policy.
              </p>
              {errors.consentTerms && (
                <p className="text-sm text-destructive">
                  {errors.consentTerms.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
