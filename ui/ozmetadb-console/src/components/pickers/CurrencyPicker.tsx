"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { currencies, majorCurrencies, type Currency } from "@/lib/data/currencies";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CurrencyPickerProps {
  value?: string;
  onChange?: (currency: Currency | null) => void;
  placeholder?: string;
  showSymbol?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CurrencyPicker({
  value,
  onChange,
  placeholder = "Select currency...",
  showSymbol = true,
  disabled = false,
  className,
}: CurrencyPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedCurrency = currencies.find((c) => c.code === value);

  const filteredCurrencies = React.useMemo(() => {
    if (!search) return currencies;
    const lower = search.toLowerCase();
    return currencies.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.code.toLowerCase().includes(lower) ||
        c.symbol.includes(search)
    );
  }, [search]);

  // Split into major and other currencies
  const { major, other } = React.useMemo(() => {
    const major = filteredCurrencies.filter((c) => majorCurrencies.includes(c.code));
    const other = filteredCurrencies.filter((c) => !majorCurrencies.includes(c.code));
    return { major, other };
  }, [filteredCurrencies]);

  const handleSelect = (currency: Currency) => {
    onChange?.(currency);
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
          {selectedCurrency ? (
            <span className="flex items-center gap-2">
              {showSymbol && <span className="font-mono text-black/60 dark:text-white/60">{selectedCurrency.symbol}</span>}
              <span>{selectedCurrency.code}</span>
              <span className="text-black/40 dark:text-white/40">- {selectedCurrency.name}</span>
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
            placeholder="Search currencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 bg-transparent"
          />
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {filteredCurrencies.length === 0 ? (
            <div className="py-6 text-center text-sm text-black/50 dark:text-white/50">No currencies found.</div>
          ) : (
            <>
              {major.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50">
                    Major Currencies
                  </div>
                  {major.map((currency) => (
                    <CurrencyItem
                      key={currency.code}
                      currency={currency}
                      selected={value === currency.code}
                      onSelect={handleSelect}
                    />
                  ))}
                </>
              )}
              {other.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50">
                    All Currencies
                  </div>
                  {other.map((currency) => (
                    <CurrencyItem
                      key={currency.code}
                      currency={currency}
                      selected={value === currency.code}
                      onSelect={handleSelect}
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

function CurrencyItem({
  currency,
  selected,
  onSelect,
}: {
  currency: Currency;
  selected: boolean;
  onSelect: (c: Currency) => void;
}) {
  return (
    <div
      onClick={() => onSelect(currency)}
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
        <span className="w-8 font-mono text-black/60 dark:text-white/60">{currency.symbol}</span>
        <span className="font-medium">{currency.code}</span>
        <span className="text-black/40 dark:text-white/40">{currency.name}</span>
      </span>
    </div>
  );
}
