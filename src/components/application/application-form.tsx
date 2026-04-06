"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";

import { applicationSchema, STEP_FIELDS } from "@/validations/application";
import type { ApplicationInput } from "@/validations/application";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepIndicator } from "@/components/application/step-indicator";
import { PersonalInfoStep } from "@/components/application/steps/personal-info-step";
import { CurrentAddressStep } from "@/components/application/steps/current-address-step";
import { EmploymentStep } from "@/components/application/steps/employment-step";
import { ReferencesStep } from "@/components/application/steps/references-step";
import { DocumentsStep, type UploadedFile } from "@/components/application/steps/documents-step";
import { ReviewStep } from "@/components/application/steps/review-step";

const STORAGE_KEY = "yr-application-draft";
const TOTAL_STEPS = 6;

interface ApplicationFormProps {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
}

export function ApplicationForm({
  propertyId,
  propertySlug,
  propertyTitle,
}: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      currentAddress: "",
      currentCity: "",
      currentState: "",
      currentZip: "",
      monthlyRent: "",
      moveInDate: "",
      employer: "",
      jobTitle: "",
      monthlyIncome: "",
      employmentLength: "",
      landlordName: "",
      landlordPhone: "",
      emergencyName: "",
      emergencyPhone: "",
      numberOfOccupants: "",
      hasPets: false,
      petDescription: "",
      additionalNotes: "",
      consentBackground: false,
      consentTerms: false,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  // Restore form data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.propertySlug === propertySlug && parsed.data) {
          const data = parsed.data as Record<string, string | boolean | undefined>;
          Object.entries(data).forEach(([key, value]) => {
            if (key in form.getValues()) {
              setValue(key as keyof ApplicationInput, value as never);
            }
          });
          if (parsed.step && parsed.step >= 1 && parsed.step <= TOTAL_STEPS) {
            setCurrentStep(parsed.step);
          }
          toast.info("Your previous draft has been restored.");
        }
      }
    } catch {
      // Silently ignore parse errors
    }
  }, [propertySlug, setValue, form]);

  // Save form data to localStorage whenever values change
  const saveToStorage = useCallback(() => {
    try {
      const data = getValues();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          propertySlug,
          step: currentStep,
          data,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Silently ignore storage errors
    }
  }, [getValues, propertySlug, currentStep]);

  // Validate current step fields
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepKey = currentStep as keyof typeof STEP_FIELDS;
    const fields = STEP_FIELDS[stepKey];
    const result = await trigger(fields as unknown as (keyof ApplicationInput)[]);

    // Special handling for step 5 pet description refinement
    if (currentStep === 5) {
      const hasPets = getValues("hasPets");
      const petDescription = getValues("petDescription");
      if (hasPets && (!petDescription || petDescription.trim() === "")) {
        form.setError("petDescription", {
          type: "manual",
          message: "Please describe your pets",
        });
        return false;
      }
    }

    return result;
  };

  // Handle Next button
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      saveToStorage();
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle Previous button
  const handlePrevious = () => {
    saveToStorage();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle step indicator clicks
  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      saveToStorage();
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle form submission
  const onSubmit = async (data: ApplicationInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          propertyId,
          documents: uploadedFiles.map((f) => ({
            fileName: f.name,
            storagePath: f.storagePath,
            url: f.url,
            fileSize: f.fileSize,
            mimeType: f.mimeType,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit application");
      }

      // Clear saved data
      localStorage.removeItem(STORAGE_KEY);
      setApplicationNumber(result.applicationNumber);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="space-y-6 p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Application Submitted
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your application for{" "}
              <span className="font-medium text-foreground">
                {propertyTitle}
              </span>{" "}
              has been received.
            </p>
          </div>

          {applicationNumber && (
            <div className="rounded-lg border bg-muted/50 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Application Number
              </p>
              <p className="mt-1 text-lg font-bold tracking-wide text-foreground">
                {applicationNumber}
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            We will review your application and get back to you within 2-3
            business days. You will receive a confirmation email with next steps.
          </p>

          <Button
            asChild
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <a href={`/listings/${propertySlug}`}>Back to Listing</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onStepClick={handleStepClick}
      />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 sm:p-8">
            {/* Step Content */}
            {currentStep === 1 && (
              <PersonalInfoStep register={register} errors={errors} />
            )}

            {currentStep === 2 && (
              <CurrentAddressStep
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {currentStep === 3 && (
              <EmploymentStep
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {currentStep === 4 && (
              <ReferencesStep register={register} errors={errors} />
            )}

            {currentStep === 5 && (
              <DocumentsStep
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
              />
            )}

            {currentStep === 6 && (
              <ReviewStep
                formData={getValues()}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="gap-2"
                  >
                    <ArrowLeft className="size-4" />
                    Previous
                  </Button>
                )}
              </div>

              <div>
                {currentStep < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
                  >
                    Next
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
