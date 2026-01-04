"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Check, X, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DynamicWizardConfig,
  generateWizardConfig,
  getWizardConfigByCode,
  getWizardEnabledTables,
  getSmartDefaults,
} from "@/lib/data/wizard-generator";
import { SYSTEM_TABLES } from "@/lib/data/meta-schema";
import type { FieldDefinition } from "@/lib/data/dimensions";

// ============================================================================
// ICON HELPER
// ============================================================================

function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const icons = LucideIcons as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || LucideIcons.File;
}

// ============================================================================
// FIELD INPUT COMPONENT
// ============================================================================

interface FieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  isDefault?: boolean;
}

function FieldInput({ field, value, onChange, isDefault }: FieldInputProps) {
  const baseInputClass = cn(
    "w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
    isDefault
      ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10"
      : "border-border"
  );

  switch (field.type) {
    case "select":
      return (
        <select
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        >
          <option value="">Select {field.label}...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm">{field.label}</span>
        </label>
      );

    case "textarea":
      return (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={baseInputClass}
        />
      );

    case "number":
    case "currency":
      return (
        <input
          type="number"
          value={(value as number) || ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case "datetime":
      return (
        <input
          type="datetime-local"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
        />
      );

    case "picker":
      return (
        <div className="relative">
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Select ${field.pickerType}...`}
            className={baseInputClass}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {field.pickerType?.toUpperCase()}
          </span>
        </div>
      );

    case "fk":
      return (
        <div className="relative">
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Select ${field.label}...`}
            className={cn(baseInputClass, "pr-16")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
            FK:{field.fkTable}
          </span>
        </div>
      );

    default:
      return (
        <input
          type={
            field.type === "email"
              ? "email"
              : field.type === "url"
                ? "url"
                : field.type === "phone"
                  ? "tel"
                  : "text"
          }
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      );
  }
}

// ============================================================================
// DYNAMIC WIZARD COMPONENT
// ============================================================================

interface DynamicWizardProps {
  tableCode: string;
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  initialData?: Record<string, unknown>;
}

export function DynamicWizard({
  tableCode,
  onComplete,
  onCancel,
  initialData = {},
}: DynamicWizardProps) {
  const config = React.useMemo(
    () => getWizardConfigByCode(tableCode),
    [tableCode]
  );

  const [currentStep, setCurrentStep] = React.useState(0);
  const smartDefaults = React.useMemo(() => getSmartDefaults(), []);
  const [data, setData] = React.useState<Record<string, unknown>>(() => ({
    ...smartDefaults,
    ...initialData,
  }));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(
    new Set()
  );

  if (!config) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
        <p className="text-red-700 dark:text-red-300">
          No wizard configuration found for table: {tableCode}
        </p>
      </div>
    );
  }

  const Icon = getIcon(config.icon);
  const currentStepConfig = config.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === config.steps.length - 1;
  const progress = ((currentStep + 1) / config.steps.length) * 100;

  const isDefaultValue = (fieldName: string): boolean => {
    return (
      !touchedFields.has(fieldName) &&
      data[fieldName] === smartDefaults[fieldName] &&
      data[fieldName] !== undefined
    );
  };

  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};
    for (const field of currentStepConfig.fields) {
      if (field.required && !data[field.name]) {
        stepErrors[field.name] = `${field.label} is required`;
      }
      if (field.validation) {
        const val = data[field.name];
        if (typeof val === "string") {
          if (
            field.validation.minLength &&
            val.length < field.validation.minLength
          ) {
            stepErrors[field.name] =
              `Minimum ${field.validation.minLength} characters`;
          }
          if (
            field.validation.maxLength &&
            val.length > field.validation.maxLength
          ) {
            stepErrors[field.name] =
              `Maximum ${field.validation.maxLength} characters`;
          }
        }
        if (typeof val === "number") {
          if (field.validation.min && val < field.validation.min) {
            stepErrors[field.name] = `Minimum value is ${field.validation.min}`;
          }
          if (field.validation.max && val > field.validation.max) {
            stepErrors[field.name] = `Maximum value is ${field.validation.max}`;
          }
        }
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (isLastStep) {
        const finalData = {
          ...data,
          [`${config.tableCode}_ID`]: `${config.tableCode.toLowerCase()}-${Date.now()}`,
          [`${config.tableCode}_CreatedAt`]: new Date().toISOString(),
          [`${config.tableCode}_UpdatedAt`]: new Date().toISOString(),
        };
        onComplete(finalData);
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((s) => s - 1);
    }
  };

  const updateField = (fieldName: string, value: unknown) => {
    setData((prev) => ({ ...prev, [fieldName]: value }));
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white/50 dark:bg-black/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 rounded-lg",
                `bg-${config.color}-100 dark:bg-${config.color}-900/30`
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm">Add New {config.tableName}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">
              Step {currentStep + 1} of {config.steps.length}:{" "}
              {currentStepConfig.title}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 mt-3">
          {config.steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => idx < currentStep && setCurrentStep(idx)}
              className={cn(
                "flex-1 h-1 rounded-full transition-all",
                idx < currentStep
                  ? "bg-green-500 cursor-pointer"
                  : idx === currentStep
                    ? "bg-blue-500"
                    : "bg-black/10 dark:bg-white/10"
              )}
              title={step.title}
            />
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
        {currentStepConfig.fields.map((field) => {
          const hasDefault = isDefaultValue(field.name);
          return (
            <div key={field.name}>
              {field.type !== "checkbox" && (
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                  {hasDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-normal flex items-center gap-0.5">
                      <Sparkles className="h-3 w-3" />
                      Auto-detected
                    </span>
                  )}
                </label>
              )}
              <FieldInput
                field={field}
                value={data[field.name]}
                onChange={(value) => updateField(field.name, value)}
                isDefault={hasDefault}
              />
              {field.helpText && (
                <p className="text-xs text-muted-foreground mt-1">
                  {field.helpText}
                </p>
              )}
              {errors[field.name] && (
                <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">
                Field: {field.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 border-t bg-white/50 dark:bg-black/20 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleBack} disabled={isFirstStep}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button size="sm" onClick={handleNext}>
          {isLastStep ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Complete
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// WIZARD SUMMARY COMPONENT
// ============================================================================

interface WizardSummaryProps {
  tableCode: string;
  data: Record<string, unknown>;
}

export function WizardSummary({ tableCode, data }: WizardSummaryProps) {
  const config = getWizardConfigByCode(tableCode);
  if (!config) return null;

  const Icon = getIcon(config.icon);
  const allFields = config.steps.flatMap((s) => s.fields);
  const filledFields = allFields.filter(
    (f) => data[f.name] !== undefined && data[f.name] !== ""
  );

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-green-700 dark:text-green-300">
          {config.tableName} Created!
        </h3>
      </div>
      <div className="space-y-1.5 text-sm">
        {filledFields.slice(0, 6).map((field) => (
          <div key={field.name} className="flex justify-between">
            <span className="text-muted-foreground">{field.label}:</span>
            <span className="font-medium">{String(data[field.name])}</span>
          </div>
        ))}
        {filledFields.length > 6 && (
          <p className="text-xs text-muted-foreground">
            +{filledFields.length - 6} more fields
          </p>
        )}
      </div>
      <p className="text-xs text-green-600 dark:text-green-400 mt-3 font-mono">
        {config.tableCode}_ID: {data[`${config.tableCode}_ID`] as string}
      </p>
    </div>
  );
}

// ============================================================================
// WIZARD SELECTOR COMPONENT
// ============================================================================

interface WizardSelectorProps {
  onSelect: (tableCode: string) => void;
}

export function WizardSelector({ onSelect }: WizardSelectorProps) {
  const wizardTables = getWizardEnabledTables();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-3">
        Select a record type to create:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {wizardTables.map((table) => {
          const Icon = getIcon(table.TB_Icon || "File");
          return (
            <button
              key={table.TB_ID}
              onClick={() => onSelect(table.TB_Code.toLowerCase())}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-all",
                "hover:bg-accent hover:border-primary/50",
                "text-left"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  `bg-${table.TB_Color}-100 dark:bg-${table.TB_Color}-900/30`
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">{table.TB_Name}</p>
                <p className="text-xs text-muted-foreground">
                  {table.TB_Code} prefix
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { getWizardEnabledTables, generateWizardConfig, getWizardConfigByCode };
