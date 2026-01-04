"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { countries, continents, type Country } from "@/lib/data/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CountryPickerProps {
  value?: string;
  onChange?: (country: Country | null) => void;
  placeholder?: string;
  showFlag?: boolean;
  showCode?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CountryPicker({
  value,
  onChange,
  placeholder = "Select country...",
  showFlag = true,
  showCode = true,
  disabled = false,
  className,
}: CountryPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedCountry = countries.find((c) => c.code === value);

  const filteredCountries = React.useMemo(() => {
    if (!search) return countries;
    const lower = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower) ||
        c.native.toLowerCase().includes(lower)
    );
  }, [search]);

  // Group by continent
  const groupedCountries = React.useMemo(() => {
    const groups: Record<string, Country[]> = {};
    filteredCountries.forEach((c) => {
      if (!groups[c.continent]) groups[c.continent] = [];
      groups[c.continent].push(c);
    });
    return groups;
  }, [filteredCountries]);

  const handleSelect = (country: Country) => {
    onChange?.(country);
    setOpen(false);
    setSearch("");
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
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              {showFlag && <span className="text-base">{selectedCountry.emoji}</span>}
              <span>{selectedCountry.name}</span>
              {showCode && <span className="text-black/40 dark:text-white/40">({selectedCountry.code})</span>}
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
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 bg-transparent"
          />
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {Object.keys(groupedCountries).length === 0 ? (
            <div className="py-6 text-center text-sm text-black/50 dark:text-white/50">No countries found.</div>
          ) : (
            Object.entries(groupedCountries).map(([continentCode, countriesList]) => (
              <div key={continentCode}>
                <div className="px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50">
                  {continents[continentCode] || continentCode}
                </div>
                {countriesList.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                      "hover:bg-black/5 dark:hover:bg-white/5",
                      value === country.code && "bg-black/5 dark:bg-white/5"
                    )}
                  >
                    {value === country.code && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <span className="text-base">{country.emoji}</span>
                      <span>{country.name}</span>
                      <span className="text-black/40 dark:text-white/40">({country.code})</span>
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
