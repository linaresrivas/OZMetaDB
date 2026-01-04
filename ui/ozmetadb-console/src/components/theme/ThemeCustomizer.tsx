"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, accentColors, type AccentColor } from "@/contexts/ThemeContext";
import { ThemeSelector } from "./ThemeToggle";
import { Label } from "@/components/ui/label";

interface ThemeCustomizerProps {
  className?: string;
}

export function ThemeCustomizer({ className }: ThemeCustomizerProps) {
  const { theme, setAccentColor, setRadius } = useTheme();

  const radiusOptions = [
    { value: "0", label: "None" },
    { value: "0.25rem", label: "Small" },
    { value: "0.5rem", label: "Medium" },
    { value: "0.75rem", label: "Large" },
    { value: "1rem", label: "Full" },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mode */}
      <div className="space-y-2">
        <Label>Appearance</Label>
        <ThemeSelector />
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <Label>Accent Color</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(accentColors) as AccentColor[]).map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              className={cn(
                "relative h-8 w-8 rounded-full transition-transform hover:scale-110",
                theme.accentColor === color && "ring-2 ring-offset-2 ring-black/20 dark:ring-white/20"
              )}
              style={{
                backgroundColor: `hsl(${accentColors[color].primary})`,
              }}
              title={color.charAt(0).toUpperCase() + color.slice(1)}
            >
              {theme.accentColor === color && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Border Radius</Label>
        <div className="flex flex-wrap gap-2">
          {radiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setRadius(option.value)}
              className={cn(
                "px-3 py-1.5 text-sm border rounded-md transition-colors",
                theme.radius === option.value
                  ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                  : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="p-4 border border-black/10 dark:border-white/10 rounded-lg space-y-3">
          <div
            className="h-10 rounded-md flex items-center justify-center text-white text-sm font-medium"
            style={{
              backgroundColor: `hsl(var(--primary))`,
              borderRadius: `var(--radius)`,
            }}
          >
            Primary Button
          </div>
          <div
            className="h-10 border border-black/10 dark:border-white/10 rounded-md flex items-center justify-center text-sm"
            style={{ borderRadius: `var(--radius)` }}
          >
            Secondary Button
          </div>
          <div
            className="p-3 bg-black/5 dark:bg-white/5 rounded-md text-sm"
            style={{ borderRadius: `var(--radius)` }}
          >
            Card content with the selected radius
          </div>
        </div>
      </div>
    </div>
  );
}
