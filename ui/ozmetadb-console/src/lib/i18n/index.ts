"use client";

/**
 * OZMetaDB Internationalization Module
 *
 * This module provides multilingual support for OZMetaDB.
 *
 * Usage:
 * 1. Wrap your app with <LanguageProvider>
 * 2. Use useTranslation() hook to get translation function
 * 3. Use t("key.name") to get translated strings
 *
 * Example:
 * ```tsx
 * import { useTranslation } from "@/lib/i18n";
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <h1>{t("common.save")}</h1>;
 * }
 * ```
 */

// Core translation function and types
export {
  t,
  getAllTranslations,
  hasTranslation,
  detectBrowserLanguage,
  TRANSLATIONS,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
  type Message,
  type MessageTranslation,
  type MessageCategory,
} from "./messages";

// React context and hooks
export {
  LanguageProvider,
  useLanguage,
  useTranslation,
  LanguageSelector,
  LanguageButtonGroup,
} from "./LanguageContext";
