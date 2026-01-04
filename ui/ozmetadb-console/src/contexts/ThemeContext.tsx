"use client";

import * as React from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeConfig {
  mode: ThemeMode;
  accentColor: string;
  radius: string;
  fontFamily: string;
}

const defaultTheme: ThemeConfig = {
  mode: "system",
  accentColor: "blue",
  radius: "0.5rem",
  fontFamily: "system-ui",
};

// Accent color presets
export const accentColors = {
  blue: { primary: "221 83% 53%", primaryForeground: "210 40% 98%" },
  violet: { primary: "262 83% 58%", primaryForeground: "210 40% 98%" },
  rose: { primary: "346 77% 50%", primaryForeground: "210 40% 98%" },
  orange: { primary: "24 95% 53%", primaryForeground: "60 9% 98%" },
  green: { primary: "142 71% 45%", primaryForeground: "60 9% 98%" },
  yellow: { primary: "48 96% 53%", primaryForeground: "24 10% 10%" },
  cyan: { primary: "189 94% 43%", primaryForeground: "60 9% 98%" },
  neutral: { primary: "0 0% 9%", primaryForeground: "0 0% 98%" },
} as const;

export type AccentColor = keyof typeof accentColors;

// Pre-built theme presets
export const themePresets = {
  classic: {
    name: "Classic",
    description: "Traditional professional look with blue accents",
    config: { mode: "light" as ThemeMode, accentColor: "blue", radius: "0.375rem", fontFamily: "system-ui" },
  },
  modern: {
    name: "Modern",
    description: "Clean and contemporary with violet accents",
    config: { mode: "light" as ThemeMode, accentColor: "violet", radius: "0.75rem", fontFamily: "'Inter', system-ui" },
  },
  compact: {
    name: "Compact",
    description: "Dense layout with smaller elements",
    config: { mode: "light" as ThemeMode, accentColor: "neutral", radius: "0.25rem", fontFamily: "'SF Mono', monospace" },
  },
  highContrast: {
    name: "High Contrast",
    description: "Accessibility-focused with strong contrast",
    config: { mode: "dark" as ThemeMode, accentColor: "cyan", radius: "0rem", fontFamily: "system-ui" },
  },
  darkPro: {
    name: "Dark Pro",
    description: "Professional dark theme for extended use",
    config: { mode: "dark" as ThemeMode, accentColor: "blue", radius: "0.5rem", fontFamily: "system-ui" },
  },
  warmLight: {
    name: "Warm Light",
    description: "Soft warm tones easy on the eyes",
    config: { mode: "light" as ThemeMode, accentColor: "orange", radius: "0.5rem", fontFamily: "'Georgia', serif" },
  },
} as const;

export type ThemePreset = keyof typeof themePresets;

interface ThemeContextValue {
  theme: ThemeConfig;
  resolvedMode: "light" | "dark";
  currentPreset: ThemePreset | null;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setRadius: (radius: string) => void;
  setFontFamily: (font: string) => void;
  toggleMode: () => void;
  applyPreset: (preset: ThemePreset) => void;
}

const defaultContextValue: ThemeContextValue = {
  theme: defaultTheme,
  resolvedMode: "light",
  currentPreset: null,
  setMode: () => {},
  setAccentColor: () => {},
  setRadius: () => {},
  setFontFamily: () => {},
  toggleMode: () => {},
  applyPreset: () => {},
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultContextValue);

export function useTheme() {
  return React.useContext(ThemeContext);
}

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): ThemeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("ozmetadb-theme");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeTheme(theme: ThemeConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ozmetadb-theme", JSON.stringify(theme));
}

// Helper to detect current preset
function detectPreset(config: ThemeConfig): ThemePreset | null {
  for (const [key, preset] of Object.entries(themePresets)) {
    const p = preset.config;
    if (
      p.mode === config.mode &&
      p.accentColor === config.accentColor &&
      p.radius === config.radius &&
      p.fontFamily === config.fontFamily
    ) {
      return key as ThemePreset;
    }
  }
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<ThemeConfig>(defaultTheme);
  const [resolvedMode, setResolvedMode] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);
  const currentPreset = React.useMemo(() => detectPreset(theme), [theme]);

  // Initialize from storage
  React.useEffect(() => {
    const stored = getStoredTheme();
    if (stored) setTheme(stored);
    setMounted(true);
  }, []);

  // Resolve system mode
  React.useEffect(() => {
    const resolve = () => {
      const mode = theme.mode === "system" ? getSystemMode() : theme.mode;
      setResolvedMode(mode);
    };

    resolve();

    // Listen for system preference changes
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme.mode === "system") resolve();
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [theme.mode]);

  // Apply theme to document
  React.useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply dark mode class
    root.classList.remove("light", "dark");
    root.classList.add(resolvedMode);

    // Apply accent color
    const accent = accentColors[theme.accentColor as AccentColor] || accentColors.blue;
    root.style.setProperty("--primary", accent.primary);
    root.style.setProperty("--primary-foreground", accent.primaryForeground);

    // Apply radius
    root.style.setProperty("--radius", theme.radius);

    // Apply font
    root.style.setProperty("--font-family", theme.fontFamily);

    // Store theme
    storeTheme(theme);
  }, [theme, resolvedMode, mounted]);

  const setMode = React.useCallback((mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }));
  }, []);

  const setAccentColor = React.useCallback((color: AccentColor) => {
    setTheme((prev) => ({ ...prev, accentColor: color }));
  }, []);

  const setRadius = React.useCallback((radius: string) => {
    setTheme((prev) => ({ ...prev, radius }));
  }, []);

  const setFontFamily = React.useCallback((fontFamily: string) => {
    setTheme((prev) => ({ ...prev, fontFamily }));
  }, []);

  const toggleMode = React.useCallback(() => {
    setTheme((prev) => ({
      ...prev,
      mode: prev.mode === "light" ? "dark" : prev.mode === "dark" ? "system" : "light",
    }));
  }, []);

  const applyPreset = React.useCallback((preset: ThemePreset) => {
    const presetConfig = themePresets[preset].config;
    setTheme({
      mode: presetConfig.mode,
      accentColor: presetConfig.accentColor,
      radius: presetConfig.radius,
      fontFamily: presetConfig.fontFamily,
    });
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedMode,
        currentPreset,
        setMode,
        setAccentColor,
        setRadius,
        setFontFamily,
        toggleMode,
        applyPreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
