"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  { full: "Personal Info", short: "Personal" },
  { full: "Address", short: "Address" },
  { full: "Employment", short: "Work" },
  { full: "References", short: "Refs" },
  { full: "Documents", short: "Docs" },
  { full: "Review", short: "Review" },
];

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  totalSteps = 6,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile: simple text indicator */}
      <div className="flex items-center justify-between sm:hidden">
        <p className="text-sm font-medium text-foreground">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="text-sm text-muted-foreground">
          {STEP_LABELS[currentStep - 1]?.full}
        </p>
      </div>

      {/* Mobile: progress bar */}
      <div className="mt-2 sm:hidden">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full step indicator */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNumber = i + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isFuture = stepNumber > currentStep;
            const isClickable = isCompleted && onStepClick;

            return (
              <div key={stepNumber} className="flex flex-1 items-center">
                {/* Step circle + label */}
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick(stepNumber)}
                    disabled={!isClickable}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                      isCompleted &&
                        "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer",
                      isCurrent &&
                        "bg-amber-500 text-white ring-4 ring-amber-500/20 scale-110",
                      isFuture &&
                        "border-2 border-muted-foreground/30 text-muted-foreground",
                      !isClickable && "cursor-default"
                    )}
                    aria-label={`Step ${stepNumber}: ${STEP_LABELS[i]?.full}`}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      stepNumber
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      isCurrent && "text-amber-600",
                      isCompleted && "text-muted-foreground",
                      isFuture && "text-muted-foreground/60"
                    )}
                  >
                    {/* Full labels on lg+, short labels on sm-md */}
                    <span className="hidden lg:inline">
                      {STEP_LABELS[i]?.full}
                    </span>
                    <span className="lg:hidden">
                      {STEP_LABELS[i]?.short}
                    </span>
                  </span>
                </div>

                {/* Connector line between steps */}
                {stepNumber < totalSteps && (
                  <div className="mx-2 h-0.5 flex-1 self-start mt-[18px]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-colors duration-200",
                        stepNumber < currentStep
                          ? "bg-amber-500"
                          : "bg-muted-foreground/20"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
