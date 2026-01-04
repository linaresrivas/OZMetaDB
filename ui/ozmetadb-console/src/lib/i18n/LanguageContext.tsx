"use client";

import * as React from "react";
import {
  type SupportedLanguage,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  t,
  detectBrowserLanguage,
} from "./messages";

// ============================================================================
// CONTEXT TYPES
// ============================================================================

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  direction: "ltr" | "rtl";
  languageInfo: typeof SUPPORTED_LANGUAGES[SupportedLanguage];
}

// ============================================================================
// CONTEXT
// ============================================================================

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

// ============================================================================
// STORAGE KEY
// ============================================================================

const LANGUAGE_STORAGE_KEY = "ozmetadb-language";

// ============================================================================
// PROVIDER
// ============================================================================

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: SupportedLanguage;
}

export function LanguageProvider({ children, defaultLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = React.useState<SupportedLanguage>(() => {
    // Check localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && stored in SUPPORTED_LANGUAGES) {
        return stored as SupportedLanguage;
      }
    }
    // Use provided default or detect from browser
    return defaultLanguage || detectBrowserLanguage();
  });

  // Persist language changes
  const setLanguage = React.useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  // Translation function bound to current language
  const translate = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return t(key, language, params);
    },
    [language]
  );

  // Get language info
  const languageInfo = SUPPORTED_LANGUAGES[language];

  // Update document direction
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = languageInfo.direction;
    }
  }, [language, languageInfo.direction]);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: translate,
      direction: languageInfo.direction,
      languageInfo,
    }),
    [language, setLanguage, translate, languageInfo]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useLanguage(): LanguageContextType {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

/**
 * Shorthand hook for just translation
 */
export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}

// ============================================================================
// LANGUAGE SELECTOR COMPONENT
// ============================================================================

interface LanguageSelectorProps {
  className?: string;
  showFlag?: boolean;
  showNativeName?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LanguageSelector({
  className,
  showFlag = true,
  showNativeName = true,
  size = "md",
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  };

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
      className={`
        ${sizeClasses[size]}
        rounded-lg border bg-background text-foreground
        focus:outline-none focus:ring-2 focus:ring-primary/50
        transition-all cursor-pointer
        ${className || ""}
      `}
    >
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
        <option key={code} value={code}>
          {showFlag ? `${info.flag} ` : ""}
          {showNativeName ? info.nativeName : info.name}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// LANGUAGE BUTTON GROUP COMPONENT
// ============================================================================

interface LanguageButtonGroupProps {
  className?: string;
  showFlag?: boolean;
}

export function LanguageButtonGroup({ className, showFlag = true }: LanguageButtonGroupProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex gap-1 ${className || ""}`}>
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
        <button
          key={code}
          onClick={() => setLanguage(code as SupportedLanguage)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${language === code
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }
          `}
          title={info.name}
        >
          {showFlag ? info.flag : code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type SupportedLanguage };
