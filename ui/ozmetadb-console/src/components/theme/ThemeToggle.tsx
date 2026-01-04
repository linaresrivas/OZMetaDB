"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleMode } = useTheme();

  const icons: Record<ThemeMode, React.ReactNode> = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const labels: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={toggleMode}
      className={cn("gap-2", className)}
      title={`Theme: ${labels[theme.mode]}`}
    >
      {icons[theme.mode]}
      {showLabel && <span>{labels[theme.mode]}</span>}
    </Button>
  );
}

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setMode } = useTheme();

  const modes: ThemeMode[] = ["light", "dark", "system"];

  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-black/5 dark:bg-white/5", className)}>
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => setMode(mode)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            theme.mode === mode
              ? "bg-white dark:bg-white/10 shadow-sm"
              : "hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          {mode === "light" && <Sun className="h-4 w-4" />}
          {mode === "dark" && <Moon className="h-4 w-4" />}
          {mode === "system" && <Monitor className="h-4 w-4" />}
          <span className="capitalize">{mode}</span>
        </button>
      ))}
    </div>
  );
}
