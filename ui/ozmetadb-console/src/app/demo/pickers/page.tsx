"use client";

import * as React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  CountryPicker,
  PhoneInput,
  CurrencyPicker,
  TimezonePicker,
  LanguagePicker,
} from "@/components/pickers";
import type { Country } from "@/lib/data/countries";
import type { Currency } from "@/lib/data/currencies";
import type { Timezone } from "@/lib/data/timezones";
import type { Language } from "@/lib/data/languages";

export default function PickersDemoPage() {
  const [country, setCountry] = React.useState<string>("US");
  const [phone, setPhone] = React.useState({ countryCode: "US", number: "", formatted: "" });
  const [currency, setCurrency] = React.useState<string>("USD");
  const [timezone, setTimezone] = React.useState<string>("America/New_York");
  const [language, setLanguage] = React.useState<string>("en");

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">International Standard Pickers</h1>
          <p className="text-black/60 dark:text-white/60 mt-1">
            ISO-compliant picker components for international data entry
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Country Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Country Picker</CardTitle>
              <p className="text-sm text-black/50 dark:text-white/50">ISO 3166-1 Alpha-2 codes</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Country</Label>
                <CountryPicker
                  value={country}
                  onChange={(c: Country | null) => c && setCountry(c.code)}
                />
              </div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Selected: <code className="bg-black/5 dark:bg-white/5 px-1 rounded">{country}</code>
              </div>
            </CardContent>
          </Card>

          {/* Phone Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Phone Input</CardTitle>
              <p className="text-sm text-black/50 dark:text-white/50">ITU-T E.164 format</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="US"
                />
              </div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Formatted: <code className="bg-black/5 dark:bg-white/5 px-1 rounded">{phone.formatted || "N/A"}</code>
              </div>
            </CardContent>
          </Card>

          {/* Currency Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Currency Picker</CardTitle>
              <p className="text-sm text-black/50 dark:text-white/50">ISO 4217 currency codes</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Currency</Label>
                <CurrencyPicker
                  value={currency}
                  onChange={(c: Currency | null) => c && setCurrency(c.code)}
                />
              </div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Selected: <code className="bg-black/5 dark:bg-white/5 px-1 rounded">{currency}</code>
              </div>
            </CardContent>
          </Card>

          {/* Timezone Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timezone Picker</CardTitle>
              <p className="text-sm text-black/50 dark:text-white/50">IANA Time Zone Database</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Timezone</Label>
                <TimezonePicker
                  value={timezone}
                  onChange={(tz: Timezone | null) => tz && setTimezone(tz.id)}
                />
              </div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Selected: <code className="bg-black/5 dark:bg-white/5 px-1 rounded">{timezone}</code>
              </div>
            </CardContent>
          </Card>

          {/* Language Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Language Picker</CardTitle>
              <p className="text-sm text-black/50 dark:text-white/50">ISO 639-1 / BCP 47</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Language</Label>
                <LanguagePicker
                  value={language}
                  onChange={(l: Language | null) => l && setLanguage(l.code)}
                />
              </div>
              <div className="text-sm text-black/60 dark:text-white/60">
                Selected: <code className="bg-black/5 dark:bg-white/5 px-1 rounded">{language}</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Values Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Form Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/5 dark:bg-white/5 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(
                {
                  country,
                  phone,
                  currency,
                  timezone,
                  language,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
