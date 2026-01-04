"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWizard } from "./WizardContext";

interface WizardNavigationProps {
  onCancel?: () => void;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function WizardNavigation({
  onCancel,
  submitLabel = "Submit",
  nextLabel = "Continue",
  previousLabel = "Back",
  cancelLabel = "Cancel",
  className,
}: WizardNavigationProps) {
  const {
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    isSubmitting,
    nextStep,
    previousStep,
    submit,
  } = useWizard();

  return (
    <div className={cn("flex items-center justify-between pt-6 border-t border-black/10 dark:border-white/10", className)}>
      <div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={!canGoPrevious}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {previousLabel}
          </Button>
        )}

        {isLastStep ? (
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!canGoNext}>
            {nextLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
