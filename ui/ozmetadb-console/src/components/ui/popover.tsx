"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopover() {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error("usePopover must be used within Popover");
  return context;
}

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { open, setOpen, triggerRef } = usePopover();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(!open);
      onClick?.(e);
    };

    return (
      <button
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        onClick={handleClick}
        aria-expanded={open}
        type="button"
        {...props}
      >
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = "PopoverTrigger";

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    const { open, setOpen } = usePopover();
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Close on click outside
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

    const alignmentClass = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    }[align];

    return (
      <div
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "dark:border-white/10 dark:bg-black/95",
          alignmentClass,
          className
        )}
        style={{ top: `calc(100% + ${sideOffset}px)` }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = "PopoverContent";
