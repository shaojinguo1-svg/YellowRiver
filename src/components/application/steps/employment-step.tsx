"use client";

import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
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

const EMPLOYMENT_LENGTH_OPTIONS = [
  { value: "less-than-1", label: "Less than 1 year" },
  { value: "1-2", label: "1-2 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-plus", label: "5+ years" },
];

interface EmploymentStepProps {
  register: UseFormRegister<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
  setValue: UseFormSetValue<ApplicationInput>;
  watch: UseFormWatch<ApplicationInput>;
}

export function EmploymentStep({
  register,
  errors,
  setValue,
  watch,
}: EmploymentStepProps) {
  const employmentLength = watch("employmentLength");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Employment Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your current employment and income.
        </p>
      </div>

      {/* Employer Name */}
      <div className="space-y-2">
        <Label htmlFor="employer">Employer Name</Label>
        <Input
          id="employer"
          placeholder="Acme Corporation"
          {...register("employer")}
          aria-invalid={!!errors.employer}
        />
        {errors.employer && (
          <p className="text-sm text-destructive">{errors.employer.message}</p>
        )}
      </div>

      {/* Job Title */}
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job Title</Label>
        <Input
          id="jobTitle"
          placeholder="Software Engineer"
          {...register("jobTitle")}
          aria-invalid={!!errors.jobTitle}
        />
        {errors.jobTitle && (
          <p className="text-sm text-destructive">{errors.jobTitle.message}</p>
        )}
      </div>

      {/* Monthly Income */}
      <div className="space-y-2">
        <Label htmlFor="monthlyIncome">
          Monthly Income <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id="monthlyIncome"
            type="number"
            placeholder="5000"
            min="0"
            step="1"
            className="pl-7"
            {...register("monthlyIncome")}
            aria-invalid={!!errors.monthlyIncome}
          />
        </div>
        {errors.monthlyIncome && (
          <p className="text-sm text-destructive">
            {errors.monthlyIncome.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Include all sources of monthly income (before taxes).
        </p>
      </div>

      {/* Employment Length */}
      <div className="space-y-2">
        <Label htmlFor="employmentLength">Length of Employment</Label>
        <Select
          value={employmentLength || ""}
          onValueChange={(value) =>
            setValue("employmentLength", value, { shouldValidate: true })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_LENGTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.employmentLength && (
          <p className="text-sm text-destructive">
            {errors.employmentLength.message}
          </p>
        )}
      </div>
    </div>
  );
}
