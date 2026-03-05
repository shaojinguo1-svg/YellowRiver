"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { ApplicationInput } from "@/validations/application";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoStepProps {
  register: UseFormRegister<ApplicationInput>;
  errors: FieldErrors<ApplicationInput>;
}

export function PersonalInfoStep({ register, errors }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about yourself so we can process your application.
        </p>
      </div>

      {/* First Name + Last Name side by side */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register("firstName")}
            aria-invalid={!!errors.firstName}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register("lastName")}
            aria-invalid={!!errors.lastName}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@example.com"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          {...register("phone")}
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">
          Date of Birth <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          {...register("dateOfBirth")}
          aria-invalid={!!errors.dateOfBirth}
        />
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          You must be at least 18 years old to apply.
        </p>
      </div>
    </div>
  );
}
