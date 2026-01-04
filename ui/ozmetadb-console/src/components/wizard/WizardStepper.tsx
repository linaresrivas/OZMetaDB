"use client";

import * as React from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "./WizardContext";

interface WizardStepperProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function WizardStepper({ orientation = "horizontal", className }: WizardStepperProps) {
  const { steps, currentStepIndex, completedSteps, goToStep } = useWizard();

  const isHorizontal = orientation === "horizontal";

  return (
    <nav
      className={cn(
        "flex",
        isHorizontal ? "flex-row items-center" : "flex-col",
        className
      )}
      aria-label="Progress"
    >
      <ol
        className={cn(
          "flex",
          isHorizontal ? "flex-row items-center space-x-2" : "flex-col space-y-4"
        )}
      >
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center",
                isHorizontal && index !== steps.length - 1 && "flex-1"
              )}
            >
              <button
                onClick={() => (isCompleted || isPast) && goToStep(index)}
                disabled={!isCompleted && !isPast && !isCurrent}
                className={cn(
                  "group flex items-center",
                  (isCompleted || isPast) && "cursor-pointer",
                  !isCompleted && !isPast && !isCurrent && "cursor-not-allowed opacity-50"
                )}
              >
                {/* Step indicator */}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : isCurrent
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-black/20 dark:border-white/20 bg-white dark:bg-white/5"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </span>

                {/* Step label */}
                {isHorizontal ? (
                  <span
                    className={cn(
                      "ml-3 text-sm font-medium hidden sm:block",
                      isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-black/50 dark:text-white/50"
                    )}
                  >
                    {step.title}
                  </span>
                ) : (
                  <div className="ml-3">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent
                          ? "text-blue-600 dark:text-blue-400"
                          : isCompleted
                          ? "text-green-600 dark:text-green-400"
                          : "text-black/50 dark:text-white/50"
                      )}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                )}
              </button>

              {/* Connector line (horizontal) */}
              {isHorizontal && index !== steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 min-w-[2rem]",
                    isCompleted ? "bg-green-500" : "bg-black/10 dark:bg-white/10"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Progress bar alternative
export function WizardProgress({ className }: { className?: string }) {
  const { progress, currentStep, steps, currentStepIndex } = useWizard();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{currentStep?.title}</span>
        <span className="text-black/50 dark:text-white/50">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>
      <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
