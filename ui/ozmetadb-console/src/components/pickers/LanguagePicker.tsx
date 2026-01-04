"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { languages, majorLanguages, type Language } from "@/lib/data/languages";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LanguagePickerProps {
  value?: string;
  onChange?: (language: Language | null) => void;
  placeholder?: string;
  showNative?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LanguagePicker({
  value,
  onChange,
  placeholder = "Select language...",
  showNative = true,
  disabled = false,
  className,
}: LanguagePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedLanguage = languages.find((l) => l.code === value);

  const filteredLanguages = React.useMemo(() => {
    if (!search) return languages;
    const lower = search.toLowerCase();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(lower) ||
        l.code.toLowerCase().includes(lower) ||
        l.native.toLowerCase().includes(lower)
    );
  }, [search]);

  // Split into major and other languages
  const { major, other } = React.useMemo(() => {
    const major = filteredLanguages.filter((l) => majorLanguages.includes(l.code));
    const other = filteredLanguages.filter((l) => !majorLanguages.includes(l.code));
    return { major, other };
  }, [filteredLanguages]);

  const handleSelect = (language: Language) => {
    onChange?.(language);
    setOpen(false);
    setSearch("");
  };

  // Detect browser language
  const detectLanguage = () => {
    const browserLang = navigator.language.split("-")[0];
    const found = languages.find((l) => l.code === browserLang);
    if (found) handleSelect(found);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selectedLanguage ? (
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 opacity-50" />
              <span>{selectedLanguage.name}</span>
              {showNative && selectedLanguage.native !== selectedLanguage.name && (
                <span className="text-black/40 dark:text-white/40">({selectedLanguage.native})</span>
              )}
              {selectedLanguage.rtl && (
                <span className="rounded bg-black/10 px-1 text-xs dark:bg-white/10">RTL</span>
              )}
            </span>
          ) : (
            <span className="text-black/40 dark:text-white/40">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center border-b border-black/10 dark:border-white/10 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent"
          />
          <button
            type="button"
            onClick={detectLanguage}
            className="text-xs text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            Detect
          </button>
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {filteredLanguages.length === 0 ? (
            <div className="py-6 text-center text-sm text-black/50 dark:text-white/50">No languages found.</div>
          ) : (
            <>
              {major.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50">
                    Common Languages
                  </div>
                  {major.map((language) => (
                    <LanguageItem
                      key={language.code}
                      language={language}
                      selected={value === language.code}
                      onSelect={handleSelect}
                      showNative={showNative}
                    />
                  ))}
                </>
              )}
              {other.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50">
                    All Languages
                  </div>
                  {other.map((language) => (
                    <LanguageItem
                      key={language.code}
                      language={language}
                      selected={value === language.code}
                      onSelect={handleSelect}
                      showNative={showNative}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LanguageItem({
  language,
  selected,
  onSelect,
  showNative,
}: {
  language: Language;
  selected: boolean;
  onSelect: (l: Language) => void;
  showNative: boolean;
}) {
  return (
    <div
      onClick={() => onSelect(language)}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "hover:bg-black/5 dark:hover:bg-white/5",
        selected && "bg-black/5 dark:bg-white/5"
      )}
    >
      {selected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
      <span className="flex items-center gap-2">
        <span className="w-8 text-black/50 dark:text-white/50">{language.code}</span>
        <span>{language.name}</span>
        {showNative && language.native !== language.name && (
          <span className="text-black/40 dark:text-white/40">{language.native}</span>
        )}
        {language.rtl && <span className="rounded bg-black/10 px-1 text-xs dark:bg-white/10">RTL</span>}
      </span>
    </div>
  );
}
