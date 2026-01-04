"use client";

import * as React from "react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isOptional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

interface WizardState {
  steps: WizardStep[];
  currentStepIndex: number;
  data: Record<string, unknown>;
  completedSteps: Set<string>;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

interface WizardContextValue extends WizardState {
  currentStep: WizardStep | undefined;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (index: number) => void;
  nextStep: () => Promise<void>;
  previousStep: () => void;
  setData: (key: string, value: unknown) => void;
  getData: <T>(key: string) => T | undefined;
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
  reset: () => void;
  submit: () => Promise<void>;
}

const WizardContext = React.createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = React.useContext(WizardContext);
  if (!context) throw new Error("useWizard must be used within WizardProvider");
  return context;
}

interface WizardProviderProps {
  steps: WizardStep[];
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  onStepChange?: (stepIndex: number, step: WizardStep) => void;
  children: React.ReactNode;
}

export function WizardProvider({
  steps,
  initialData = {},
  onSubmit,
  onStepChange,
  children,
}: WizardProviderProps) {
  const [state, setState] = React.useState<WizardState>({
    steps,
    currentStepIndex: 0,
    data: initialData,
    completedSteps: new Set(),
    isSubmitting: false,
    errors: {},
  });

  const currentStep = state.steps[state.currentStepIndex];
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.steps.length - 1;
  const progress = ((state.currentStepIndex + 1) / state.steps.length) * 100;
  const canGoPrevious = !isFirstStep && !state.isSubmitting;
  const canGoNext = !state.isSubmitting;

  const goToStep = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < state.steps.length) {
        setState((prev) => ({ ...prev, currentStepIndex: index }));
        onStepChange?.(index, state.steps[index]);
      }
    },
    [state.steps, onStepChange]
  );

  const nextStep = React.useCallback(async () => {
    if (!currentStep) return;

    // Validate current step if validator exists
    if (currentStep.validate) {
      const isValid = await currentStep.validate();
      if (!isValid) return;
    }

    setState((prev) => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, currentStep.id]),
    }));

    if (!isLastStep) {
      goToStep(state.currentStepIndex + 1);
    }
  }, [currentStep, isLastStep, state.currentStepIndex, goToStep]);

  const previousStep = React.useCallback(() => {
    if (!isFirstStep) {
      goToStep(state.currentStepIndex - 1);
    }
  }, [isFirstStep, state.currentStepIndex, goToStep]);

  const setData = React.useCallback((key: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  }, []);

  const getData = React.useCallback(
    <T,>(key: string): T | undefined => {
      return state.data[key] as T | undefined;
    },
    [state.data]
  );

  const setError = React.useCallback((key: string, error: string) => {
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [key]: error },
    }));
  }, []);

  const clearError = React.useCallback((key: string) => {
    setState((prev) => {
      const { [key]: _, ...rest } = prev.errors;
      return { ...prev, errors: rest };
    });
  }, []);

  const reset = React.useCallback(() => {
    setState({
      steps,
      currentStepIndex: 0,
      data: initialData,
      completedSteps: new Set(),
      isSubmitting: false,
      errors: {},
    });
  }, [steps, initialData]);

  const submit = React.useCallback(async () => {
    if (!onSubmit) return;

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(state.data);
      // Mark all steps as completed
      setState((prev) => ({
        ...prev,
        completedSteps: new Set(prev.steps.map((s) => s.id)),
        isSubmitting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        errors: { ...prev.errors, submit: error instanceof Error ? error.message : "Submission failed" },
      }));
    }
  }, [onSubmit, state.data]);

  const value: WizardContextValue = {
    ...state,
    currentStep,
    isFirstStep,
    isLastStep,
    progress,
    canGoNext,
    canGoPrevious,
    goToStep,
    nextStep,
    previousStep,
    setData,
    getData,
    setError,
    clearError,
    reset,
    submit,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}
