"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type FieldDefinition,
  customerFields,
  contactFields,
  projectFields,
  addressFields,
} from "@/lib/data/dimensions";

// ============================================================================
// SMART DEFAULTS - Auto-detect from browser/locale
// ============================================================================

function getSmartDefaults(): Record<string, unknown> {
  // Try to detect user's locale info from browser
  const browserLang = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const langCode = browserLang.split("-")[0]; // e.g., "en" from "en-US"
  const regionCode = browserLang.split("-")[1]?.toUpperCase() || "US"; // e.g., "US"

  // Detect timezone
  const timezone = typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "America/New_York";

  // Currency mapping based on country
  const currencyMap: Record<string, string> = {
    US: "USD", CA: "CAD", GB: "GBP", EU: "EUR", DE: "EUR", FR: "EUR",
    ES: "EUR", IT: "EUR", JP: "JPY", CN: "CNY", AU: "AUD", NZ: "NZD",
    MX: "MXN", BR: "BRL", IN: "INR", KR: "KRW", CH: "CHF", SE: "SEK",
    NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RU: "RUB",
    ZA: "ZAR", SG: "SGD", HK: "HKD", TW: "TWD", TH: "THB", MY: "MYR",
    PH: "PHP", ID: "IDR", VN: "VND", AE: "AED", SA: "SAR", IL: "ILS",
    TR: "TRY", EG: "EGP", NG: "NGN", KE: "KES", AR: "ARS", CL: "CLP",
    CO: "COP", PE: "PEN",
  };
  const currency = currencyMap[regionCode] || "USD";

  return {
    // Customer defaults (CU prefix)
    CU_Language: langCode,
    CU_Timezone: timezone,
    CU_Country: regionCode,
    CU_Currency: currency,
    CU_Status: "prospect",
    CU_Type: "business",

    // Contact defaults (CO prefix)
    CO_Language: langCode,
    CO_Timezone: timezone,
    CO_Type: "primary",
    CO_IsActive: true,

    // Project defaults (PJ prefix)
    PJ_Status: "draft",
    PJ_Type: "internal",
    PJ_Priority: "medium",
    PJ_Timezone: timezone,
    PJ_Language: langCode,
    PJ_Country: regionCode,
    PJ_BudgetCurrency: currency,

    // Address defaults (AD prefix)
    AD_Type: "work",
    AD_Country: regionCode,
    AD_Timezone: timezone,

    // Organization defaults (OR prefix)
    OR_Status: "active",
    OR_Type: "corporation",
    OR_Country: regionCode,
    OR_Timezone: timezone,
    OR_Language: langCode,
    OR_RevenueCurrency: currency,
  };
}

// ============================================================================
// WIZARD TYPES
// ============================================================================

export type WizardType = "customer" | "contact" | "project" | "address";

export interface WizardStep {
  id: string;
  title: string;
  fields: FieldDefinition[];
}

export interface WizardConfig {
  type: WizardType;
  title: string;
  description: string;
  steps: WizardStep[];
}

export interface WizardState {
  config: WizardConfig;
  currentStep: number;
  data: Record<string, unknown>;
  isComplete: boolean;
}

// ============================================================================
// WIZARD CONFIGURATIONS
// ============================================================================

function groupFieldsByGroup(fields: FieldDefinition[]): Map<string, FieldDefinition[]> {
  const groups = new Map<string, FieldDefinition[]>();
  for (const field of fields) {
    const groupName = field.group || "General";
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(field);
  }
  return groups;
}

export const wizardConfigs: Record<WizardType, WizardConfig> = {
  customer: {
    type: "customer",
    title: "Add New Customer",
    description: "Create a new customer record with TREM_ID naming convention",
    steps: (() => {
      const groups = groupFieldsByGroup(customerFields);
      return Array.from(groups.entries()).map(([groupName, fields]) => ({
        id: groupName.toLowerCase().replace(/\s+/g, "-"),
        title: groupName,
        fields,
      }));
    })(),
  },
  contact: {
    type: "contact",
    title: "Add New Contact",
    description: "Create a new contact record linked to a customer",
    steps: (() => {
      const groups = groupFieldsByGroup(contactFields);
      return Array.from(groups.entries()).map(([groupName, fields]) => ({
        id: groupName.toLowerCase().replace(/\s+/g, "-"),
        title: groupName,
        fields,
      }));
    })(),
  },
  project: {
    type: "project",
    title: "Add New Project",
    description: "Create a new project for a customer",
    steps: (() => {
      const groups = groupFieldsByGroup(projectFields);
      return Array.from(groups.entries()).map(([groupName, fields]) => ({
        id: groupName.toLowerCase().replace(/\s+/g, "-"),
        title: groupName,
        fields,
      }));
    })(),
  },
  address: {
    type: "address",
    title: "Add New Address",
    description: "Create a new address record",
    steps: [
      {
        id: "address",
        title: "Address Details",
        fields: addressFields,
      },
    ],
  },
};

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
    isDefault ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10" : "border-border"
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
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
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

    case "picker":
      // For picker types, show a simplified input with picker type hint
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

    default:
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      );
  }
}

// ============================================================================
// WIZARD COMPONENT
// ============================================================================

interface DataEntryWizardProps {
  type: WizardType;
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  initialData?: Record<string, unknown>;
}

export function DataEntryWizard({
  type,
  onComplete,
  onCancel,
  initialData = {},
}: DataEntryWizardProps) {
  const config = wizardConfigs[type];
  const [currentStep, setCurrentStep] = React.useState(0);

  // Get smart defaults once
  const smartDefaults = React.useMemo(() => getSmartDefaults(), []);

  // Merge smart defaults with any provided initial data
  const [data, setData] = React.useState<Record<string, unknown>>(() => {
    return { ...smartDefaults, ...initialData };
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  // Track which fields have been manually touched/modified
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());

  // Check if a field still has its default value (not touched by user)
  const isDefaultValue = (fieldName: string): boolean => {
    return !touchedFields.has(fieldName) && data[fieldName] === smartDefaults[fieldName] && data[fieldName] !== undefined;
  };

  const currentStepConfig = config.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === config.steps.length - 1;
  const progress = ((currentStep + 1) / config.steps.length) * 100;

  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};
    for (const field of currentStepConfig.fields) {
      if (field.required && !data[field.name]) {
        stepErrors[field.name] = `${field.label} is required`;
      }
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (isLastStep) {
        // Generate ID and timestamps
        const prefix = type.toUpperCase().slice(0, 4);
        const finalData = {
          ...data,
          [`${prefix}_ID`]: `${type}-${Date.now()}`,
          [`${prefix}_CreatedAt`]: new Date().toISOString(),
          [`${prefix}_UpdatedAt`]: new Date().toISOString(),
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
    // Mark field as touched when user modifies it
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
          <h3 className="font-semibold text-sm">{config.title}</h3>
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
              Step {currentStep + 1} of {config.steps.length}: {currentStepConfig.title}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-normal">
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
                <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
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
  type: WizardType;
  data: Record<string, unknown>;
}

export function WizardSummary({ type, data }: WizardSummaryProps) {
  const config = wizardConfigs[type];
  const allFields = config.steps.flatMap((s) => s.fields);

  const filledFields = allFields.filter((f) => data[f.name] !== undefined && data[f.name] !== "");

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-green-700 dark:text-green-300">
          {config.title} - Complete!
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
      <p className="text-xs text-green-600 dark:text-green-400 mt-3">
        Record saved with TREM_ID naming convention
      </p>
    </div>
  );
}
