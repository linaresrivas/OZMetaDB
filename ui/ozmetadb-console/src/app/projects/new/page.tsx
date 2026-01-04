"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  WizardProvider,
  WizardStepper,
  WizardProgress,
  WizardNavigation,
  useWizard,
  type WizardStep,
} from "@/components/wizard";
import {
  CountryPicker,
  CurrencyPicker,
  TimezonePicker,
  LanguagePicker,
} from "@/components/pickers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Country } from "@/lib/data/countries";
import type { Currency } from "@/lib/data/currencies";
import type { Timezone } from "@/lib/data/timezones";
import type { Language } from "@/lib/data/languages";

// Define wizard steps
const wizardSteps: WizardStep[] = [
  { id: "basics", title: "Project Basics", description: "Name and description" },
  { id: "platform", title: "Target Platform", description: "Choose deployment target" },
  { id: "locale", title: "Localization", description: "Regional settings" },
  { id: "dimensions", title: "Dimensions", description: "Select standard dimensions" },
  { id: "review", title: "Review", description: "Confirm settings" },
];

// Step 1: Project Basics
function StepBasics() {
  const { getData, setData } = useWizard();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          placeholder="My Data Warehouse"
          value={getData<string>("name") || ""}
          onChange={(e) => setData("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Project Code</Label>
        <Input
          id="code"
          placeholder="my-dw (auto-generated if empty)"
          value={getData<string>("code") || ""}
          onChange={(e) => setData("code", e.target.value)}
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          Used for API endpoints and file generation
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          placeholder="Describe your project..."
          value={getData<string>("description") || ""}
          onChange={(e) => setData("description", e.target.value)}
          className="flex min-h-[100px] w-full rounded-md border border-black/10 bg-white/60 px-3 py-2 text-sm placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white/5 dark:border-white/10 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <Label>Project Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "warehouse", label: "Data Warehouse", desc: "Traditional star/snowflake schema" },
            { value: "lakehouse", label: "Lakehouse", desc: "Delta Lake / Iceberg tables" },
            { value: "semantic", label: "Semantic Layer", desc: "Business metrics & dimensions" },
            { value: "hybrid", label: "Hybrid", desc: "Combined approach" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setData("projectType", type.value)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                getData<string>("projectType") === type.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-xs text-black/50 dark:text-white/50 mt-1">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2: Target Platform
function StepPlatform() {
  const { getData, setData } = useWizard();

  const platforms = [
    { value: "azure-sql", label: "Azure SQL", icon: "🔷" },
    { value: "fabric", label: "Microsoft Fabric", icon: "🟣" },
    { value: "bigquery", label: "Google BigQuery", icon: "🔵" },
    { value: "snowflake", label: "Snowflake", icon: "❄️" },
    { value: "databricks", label: "Databricks", icon: "🧱" },
    { value: "redshift", label: "AWS Redshift", icon: "🟠" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Primary Platform *</Label>
        <div className="grid grid-cols-3 gap-3">
          {platforms.map((platform) => (
            <button
              key={platform.value}
              onClick={() => setData("platform", platform.value)}
              className={`p-4 rounded-lg border text-center transition-colors ${
                getData<string>("platform") === platform.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <div className="text-2xl mb-2">{platform.icon}</div>
              <div className="font-medium text-sm">{platform.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Additional Targets (optional)</Label>
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">
          Generate artifacts for multiple platforms
        </p>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const selected = getData<string[]>("additionalPlatforms") || [];
            const isSelected = selected.includes(platform.value);
            const isPrimary = getData<string>("platform") === platform.value;

            if (isPrimary) return null;

            return (
              <button
                key={platform.value}
                onClick={() => {
                  const newSelection = isSelected
                    ? selected.filter((p) => p !== platform.value)
                    : [...selected, platform.value];
                  setData("additionalPlatforms", newSelection);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {platform.icon} {platform.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 3: Localization
function StepLocale() {
  const { getData, setData } = useWizard();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Default Country</Label>
        <CountryPicker
          value={getData<string>("country") || "US"}
          onChange={(c: Country | null) => c && setData("country", c.code)}
        />
      </div>

      <div className="space-y-2">
        <Label>Default Currency</Label>
        <CurrencyPicker
          value={getData<string>("currency") || "USD"}
          onChange={(c: Currency | null) => c && setData("currency", c.code)}
        />
      </div>

      <div className="space-y-2">
        <Label>Default Timezone</Label>
        <TimezonePicker
          value={getData<string>("timezone") || "America/New_York"}
          onChange={(tz: Timezone | null) => tz && setData("timezone", tz.id)}
        />
      </div>

      <div className="space-y-2">
        <Label>Default Language</Label>
        <LanguagePicker
          value={getData<string>("language") || "en"}
          onChange={(l: Language | null) => l && setData("language", l.code)}
        />
      </div>
    </div>
  );
}

// Step 4: Dimensions
function StepDimensions() {
  const { getData, setData } = useWizard();
  const selected = getData<string[]>("dimensions") || [];

  const dimensions = [
    { id: "customer", name: "Customer", desc: "Customer/Client dimension with standard fields" },
    { id: "contact", name: "Contact", desc: "Contact persons with E.164 phone support" },
    { id: "address", name: "Address", desc: "Addresses with ISO 3166 country codes" },
    { id: "organization", name: "Organization", desc: "Companies with LEI and DUNS support" },
    { id: "date", name: "Date", desc: "Date dimension with fiscal calendar support" },
    { id: "time", name: "Time", desc: "Time-of-day dimension" },
    { id: "product", name: "Product", desc: "Product catalog dimension" },
    { id: "employee", name: "Employee", desc: "Employee/Staff dimension" },
  ];

  const toggleDimension = (id: string) => {
    const newSelection = selected.includes(id)
      ? selected.filter((d) => d !== id)
      : [...selected, id];
    setData("dimensions", newSelection);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-black/60 dark:text-white/60">
        Select the standard dimensions to include in your project. You can add more later.
      </p>

      <div className="grid gap-3">
        {dimensions.map((dim) => (
          <button
            key={dim.id}
            onClick={() => toggleDimension(dim.id)}
            className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-colors ${
              selected.includes(dim.id)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <div
              className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center ${
                selected.includes(dim.id)
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-black/20 dark:border-white/20"
              }`}
            >
              {selected.includes(dim.id) && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <div className="font-medium">{dim.name}</div>
              <div className="text-sm text-black/50 dark:text-white/50">{dim.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 5: Review
function StepReview() {
  const { getData } = useWizard();

  const sections = [
    {
      title: "Project Basics",
      items: [
        { label: "Name", value: getData<string>("name") || "—" },
        { label: "Code", value: getData<string>("code") || "(auto-generated)" },
        { label: "Type", value: getData<string>("projectType") || "—" },
      ],
    },
    {
      title: "Platform",
      items: [
        { label: "Primary", value: getData<string>("platform") || "—" },
        { label: "Additional", value: (getData<string[]>("additionalPlatforms") || []).join(", ") || "None" },
      ],
    },
    {
      title: "Localization",
      items: [
        { label: "Country", value: getData<string>("country") || "—" },
        { label: "Currency", value: getData<string>("currency") || "—" },
        { label: "Timezone", value: getData<string>("timezone") || "—" },
        { label: "Language", value: getData<string>("language") || "—" },
      ],
    },
    {
      title: "Dimensions",
      items: [
        { label: "Selected", value: (getData<string[]>("dimensions") || []).join(", ") || "None" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-black/60 dark:text-white/60">
        Review your project settings before creating.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h4 className="font-medium text-sm text-black/50 dark:text-white/50">{section.title}</h4>
          <div className="rounded-lg border border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10">
            {section.items.map((item) => (
              <div key={item.label} className="flex justify-between py-2 px-3 text-sm">
                <span className="text-black/60 dark:text-white/60">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main wizard content
function WizardContent() {
  const { currentStepIndex } = useWizard();

  const steps = [
    <StepBasics key="basics" />,
    <StepPlatform key="platform" />,
    <StepLocale key="locale" />,
    <StepDimensions key="dimensions" />,
    <StepReview key="review" />,
  ];

  return steps[currentStepIndex];
}

// Page component
export default function NewProjectPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Project created:", data);
    router.push("/projects");
  };

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="text-black/60 dark:text-white/60 mt-1">
            Set up your metadata project with the wizard
          </p>
        </div>

        <WizardProvider
          steps={wizardSteps}
          initialData={{
            country: "US",
            currency: "USD",
            timezone: "America/New_York",
            language: "en",
            projectType: "warehouse",
            dimensions: ["customer", "date"],
          }}
          onSubmit={handleSubmit}
        >
          <Card>
            <CardHeader className="border-b border-black/10 dark:border-white/10">
              <WizardStepper orientation="horizontal" />
            </CardHeader>
            <CardContent className="pt-6">
              <WizardProgress className="mb-6" />
              <WizardContent />
              <WizardNavigation
                onCancel={() => router.push("/projects")}
                submitLabel="Create Project"
              />
            </CardContent>
          </Card>
        </WizardProvider>
      </div>
    </AppShell>
  );
}
