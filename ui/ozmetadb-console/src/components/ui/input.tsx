import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-black/10 bg-white/60 px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-black/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:border-black/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/40",
          "dark:focus-visible:ring-white/20 dark:focus-visible:border-white/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
