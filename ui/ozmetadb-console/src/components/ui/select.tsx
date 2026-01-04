"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("useSelect must be used within Select");
  return context;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value: controlledValue, defaultValue = "", onValueChange, children, disabled }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  const value = controlledValue ?? uncontrolledValue;
  const handleValueChange = (v: string) => {
    if (!controlledValue) setUncontrolledValue(v);
    onValueChange?.(v);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className={cn("relative inline-block w-full", disabled && "pointer-events-none opacity-50")}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelect();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-black/10 bg-white/60 px-3 py-2 text-sm shadow-sm",
          "placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-white/5 dark:border-white/10 dark:text-white",
          className
        )}
        aria-expanded={open}
        {...props}
      >
        {children}
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelect();
  return <span className={cn(!value && "text-black/40 dark:text-white/40")}>{value || placeholder}</span>;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useSelect();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [open, setOpen]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur",
          "dark:border-white/10 dark:bg-black/95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, disabled, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useSelect();
    const isSelected = value === selectedValue;

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        onClick={() => !disabled && onValueChange(value)}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
          "hover:bg-black/5 dark:hover:bg-white/5",
          isSelected && "bg-black/5 dark:bg-white/5",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        {isSelected && (
          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-4 w-4" />
          </span>
        )}
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

export function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div className="py-1">{children}</div>;
}

export function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-black/50 dark:text-white/50", className)}>{children}</div>;
}

export function SelectSeparator() {
  return <div className="-mx-1 my-1 h-px bg-black/10 dark:bg-white/10" />;
}
