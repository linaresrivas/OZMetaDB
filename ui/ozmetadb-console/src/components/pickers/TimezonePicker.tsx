"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { timezones, timezoneRegions, type Timezone, formatTimezoneDisplay } from "@/lib/data/timezones";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TimezonePickerProps {
  value?: string;
  onChange?: (timezone: Timezone | null) => void;
  placeholder?: string;
  showOffset?: boolean;
  disabled?: boolean;
  className?: string;
}

export function TimezonePicker({
  value,
  onChange,
  placeholder = "Select timezone...",
  showOffset = true,
  disabled = false,
  className,
}: TimezonePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedTimezone = timezones.find((tz) => tz.id === value);

  const filteredTimezones = React.useMemo(() => {
    if (!search) return timezones;
    const lower = search.toLowerCase();
    return timezones.filter(
      (tz) =>
        tz.name.toLowerCase().includes(lower) ||
        tz.id.toLowerCase().includes(lower) ||
        tz.abbr.toLowerCase().includes(lower) ||
        tz.offset.includes(search)
    );
  }, [search]);

  // Group by region
  const groupedTimezones = React.useMemo(() => {
    const groups: Record<string, Timezone[]> = {};
    timezoneRegions.forEach((region) => {
      const regionTimezones = filteredTimezones.filter((tz) => tz.region === region);
      if (regionTimezones.length > 0) {
        groups[region] = regionTimezones;
      }
    });
    return groups;
  }, [filteredTimezones]);

  const handleSelect = (timezone: Timezone) => {
    onChange?.(timezone);
    setOpen(false);
    setSearch("");
  };

  // Detect user's timezone
  const detectTimezone = () => {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = timezones.find((tz) => tz.id === userTz);
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
          {selectedTimezone ? (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 opacity-50" />
              {showOffset && (
                <span className="font-mono text-black/60 dark:text-white/60">UTC{selectedTimezone.offset}</span>
              )}
              <span>{selectedTimezone.name}</span>
              <span className="text-black/40 dark:text-white/40">({selectedTimezone.abbr})</span>
            </span>
          ) : (
            <span className="text-black/40 dark:text-white/40">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="flex items-center border-b border-black/10 dark:border-white/10 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search timezones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent"
          />
          <button
            type="button"
            onClick={detectTimezone}
            className="text-xs text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
          >
            Detect
          </button>
        </div>
        <div className="max-h-72 overflow-auto p-1">
          {Object.keys(groupedTimezones).length === 0 ? (
            <div className="py-6 text-center text-sm text-black/50 dark:text-white/50">No timezones found.</div>
          ) : (
            Object.entries(groupedTimezones).map(([region, tzList]) => (
              <div key={region}>
                <div className="px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50">{region}</div>
                {tzList.map((tz) => (
                  <div
                    key={tz.id}
                    onClick={() => handleSelect(tz)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
                      "hover:bg-black/5 dark:hover:bg-white/5",
                      value === tz.id && "bg-black/5 dark:bg-white/5"
                    )}
                  >
                    {value === tz.id && (
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <span className="w-16 font-mono text-xs text-black/50 dark:text-white/50">
                        UTC{tz.offset}
                      </span>
                      <span>{tz.name}</span>
                      <span className="text-black/40 dark:text-white/40">({tz.abbr})</span>
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
