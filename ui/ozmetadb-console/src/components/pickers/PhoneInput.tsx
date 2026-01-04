"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { countries, type Country } from "@/lib/data/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface PhoneInputProps {
  value?: { countryCode: string; number: string };
  onChange?: (value: { countryCode: string; number: string; formatted: string }) => void;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "US",
  placeholder = "Phone number",
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [countryCode, setCountryCode] = React.useState(value?.countryCode || defaultCountry);
  const [number, setNumber] = React.useState(value?.number || "");

  const selectedCountry = countries.find((c) => c.code === countryCode);

  const filteredCountries = React.useMemo(() => {
    if (!search) return countries;
    const lower = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower) ||
        c.phone.includes(search)
    );
  }, [search]);

  const formatPhoneNumber = (country: Country, num: string): string => {
    return `+${country.phone} ${num}`;
  };

  const handleCountrySelect = (country: Country) => {
    setCountryCode(country.code);
    setOpen(false);
    setSearch("");
    if (onChange) {
      onChange({
        countryCode: country.code,
        number,
        formatted: formatPhoneNumber(country, number),
      });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^\d\s\-()]/g, "");
    setNumber(newNumber);
    if (onChange && selectedCountry) {
      onChange({
        countryCode,
        number: newNumber,
        formatted: formatPhoneNumber(selectedCountry, newNumber),
      });
    }
  };

  return (
    <div className={cn("flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-9 items-center gap-1 rounded-l-md border border-r-0 border-black/10 bg-white/60 px-2 text-sm",
              "hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20",
              "dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <span className="text-base">{selectedCountry?.emoji}</span>
            <span className="text-black/60 dark:text-white/60">+{selectedCountry?.phone}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="flex items-center border-b border-black/10 dark:border-white/10 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 bg-transparent"
            />
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-black/50 dark:text-white/50">No countries found.</div>
            ) : (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "flex cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 px-2 text-sm outline-none",
                    "hover:bg-black/5 dark:hover:bg-white/5",
                    countryCode === country.code && "bg-black/5 dark:bg-white/5"
                  )}
                >
                  <span className="text-base">{country.emoji}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-black/40 dark:text-white/40">+{country.phone}</span>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-l-none"
      />
    </div>
  );
}
