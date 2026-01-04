"use client";

import * as React from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useTheme,
  themePresets,
  accentColors,
  type ThemePreset,
  type AccentColor,
  type ThemeMode,
} from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Sun, Moon, Monitor, Check, Palette, Type, Circle, Globe } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n/LanguageContext";

function PresetCard({ presetKey, preset, isActive, onSelect }: {
  presetKey: ThemePreset;
  preset: typeof themePresets[ThemePreset];
  isActive: boolean;
  onSelect: () => void;
}) {
  const isDark = preset.config.mode === "dark";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left",
        "hover:border-primary/50 hover:shadow-md",
        isActive ? "border-primary bg-primary/5 shadow-md" : "border-border"
      )}
    >
      {isActive && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="h-3 w-3" />
        </div>
      )}
      <div className={cn(
        "w-full h-16 rounded-md mb-3 border overflow-hidden",
        isDark ? "bg-slate-900" : "bg-white"
      )}>
        <div className="flex h-full">
          <div className={cn(
            "w-1/4 h-full",
            isDark ? "bg-slate-800" : "bg-slate-100"
          )} />
          <div className="flex-1 p-2 flex flex-col gap-1">
            <div className={cn(
              "h-2 w-3/4 rounded",
              isDark ? "bg-slate-700" : "bg-slate-200"
            )} />
            <div className={cn(
              "h-2 w-1/2 rounded",
              isDark ? "bg-slate-700" : "bg-slate-200"
            )} />
            <div
              className="h-3 w-1/3 rounded mt-auto"
              style={{
                backgroundColor: `hsl(${accentColors[preset.config.accentColor as AccentColor]?.primary || "221 83% 53%"})`,
                borderRadius: preset.config.radius
              }}
            />
          </div>
        </div>
      </div>
      <span className="font-medium text-sm">{preset.name}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{preset.description}</span>
    </button>
  );
}

function ColorSwatch({ color, colorKey, isActive, onSelect }: {
  color: typeof accentColors[AccentColor];
  colorKey: AccentColor;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative h-10 w-10 rounded-full transition-all",
        "hover:scale-110 hover:shadow-lg",
        isActive && "ring-2 ring-offset-2 ring-primary"
      )}
      style={{ backgroundColor: `hsl(${color.primary})` }}
      title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
    >
      {isActive && (
        <Check
          className="absolute inset-0 m-auto h-4 w-4"
          style={{ color: `hsl(${color.primaryForeground})` }}
        />
      )}
    </button>
  );
}

function ModeButton({ mode, icon, label, isActive, onSelect }: {
  mode: ThemeMode;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all",
        "hover:border-primary/50",
        isActive ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {isActive && <Check className="ml-auto h-4 w-4 text-primary" />}
    </button>
  );
}

function LanguageButton({ langCode, langInfo, isActive, onSelect }: {
  langCode: SupportedLanguage;
  langInfo: typeof SUPPORTED_LANGUAGES[SupportedLanguage];
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all",
        "hover:border-primary/50",
        isActive ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <span className="text-xl">{langInfo.flag}</span>
      <div className="flex flex-col items-start">
        <span className="font-medium">{langInfo.nativeName}</span>
        <span className="text-xs text-muted-foreground">{langInfo.name}</span>
      </div>
      {isActive && <Check className="ml-auto h-4 w-4 text-primary" />}
    </button>
  );
}

function RadiusOption({ value, label, isActive, onSelect }: {
  value: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-2 transition-all",
        "hover:border-primary/50",
        isActive ? "border-primary bg-primary/5" : "border-border"
      )}
      style={{ borderRadius: value }}
    >
      <div
        className="h-6 w-6 bg-primary"
        style={{ borderRadius: value }}
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function SettingsPage() {
  const { theme, currentPreset, setMode, setAccentColor, setRadius, applyPreset } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize the appearance and behavior of OZMetaDB Console
          </p>
        </div>

        {/* Theme Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Presets
            </CardTitle>
            <CardDescription>
              Choose a pre-configured theme or customize your own below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(themePresets) as [ThemePreset, typeof themePresets[ThemePreset]][]).map(
                ([key, preset]) => (
                  <PresetCard
                    key={key}
                    presetKey={key}
                    preset={preset}
                    isActive={currentPreset === key}
                    onSelect={() => applyPreset(key)}
                  />
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Appearance Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance Mode
            </CardTitle>
            <CardDescription>
              Select your preferred color scheme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ModeButton
                mode="light"
                icon={<Sun className="h-5 w-5" />}
                label="Light"
                isActive={theme.mode === "light"}
                onSelect={() => setMode("light")}
              />
              <ModeButton
                mode="dark"
                icon={<Moon className="h-5 w-5" />}
                label="Dark"
                isActive={theme.mode === "dark"}
                onSelect={() => setMode("dark")}
              />
              <ModeButton
                mode="system"
                icon={<Monitor className="h-5 w-5" />}
                label="System"
                isActive={theme.mode === "system"}
                onSelect={() => setMode("system")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>
              Choose your preferred language for the interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.entries(SUPPORTED_LANGUAGES) as [SupportedLanguage, typeof SUPPORTED_LANGUAGES[SupportedLanguage]][]).map(
                ([key, info]) => (
                  <LanguageButton
                    key={key}
                    langCode={key}
                    langInfo={info}
                    isActive={language === key}
                    onSelect={() => setLanguage(key)}
                  />
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5" />
              Accent Color
            </CardTitle>
            <CardDescription>
              Choose your preferred primary color
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(accentColors) as [AccentColor, typeof accentColors[AccentColor]][]).map(
                ([key, color]) => (
                  <ColorSwatch
                    key={key}
                    colorKey={key}
                    color={color}
                    isActive={theme.accentColor === key}
                    onSelect={() => setAccentColor(key)}
                  />
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Border Radius
            </CardTitle>
            <CardDescription>
              Adjust the roundness of UI elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <RadiusOption
                value="0rem"
                label="None"
                isActive={theme.radius === "0rem"}
                onSelect={() => setRadius("0rem")}
              />
              <RadiusOption
                value="0.25rem"
                label="Small"
                isActive={theme.radius === "0.25rem"}
                onSelect={() => setRadius("0.25rem")}
              />
              <RadiusOption
                value="0.375rem"
                label="Medium"
                isActive={theme.radius === "0.375rem"}
                onSelect={() => setRadius("0.375rem")}
              />
              <RadiusOption
                value="0.5rem"
                label="Default"
                isActive={theme.radius === "0.5rem"}
                onSelect={() => setRadius("0.5rem")}
              />
              <RadiusOption
                value="0.75rem"
                label="Large"
                isActive={theme.radius === "0.75rem"}
                onSelect={() => setRadius("0.75rem")}
              />
              <RadiusOption
                value="1rem"
                label="Full"
                isActive={theme.radius === "1rem"}
                onSelect={() => setRadius("1rem")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>
              Your active theme settings (stored in browser)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
{JSON.stringify({
  preset: currentPreset || "custom",
  mode: theme.mode,
  accentColor: theme.accentColor,
  radius: theme.radius,
  fontFamily: theme.fontFamily,
  language: language,
}, null, 2)}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => applyPreset("classic")}
              >
                Reset to Classic
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
