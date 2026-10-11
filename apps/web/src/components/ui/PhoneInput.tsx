import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  hint?: string;
  loading?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { className, label, value = "", onChange, error, hint, loading, disabled, id, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Keep only numbers and max 10 digits
      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
      onChange?.(cleaned);
    };

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink select-none">
            {label}
          </label>
        )}
        <div className="relative flex rounded-md border border-muted/50 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 bg-white transition-all">
          <div className="flex items-center px-3 bg-surface/30 border-r border-muted/30 text-ink text-sm font-medium rounded-l-md select-none">
            <span>🇮🇳</span>
            <span className="ml-1.5">+91</span>
          </div>
          <input
            id={inputId}
            ref={ref}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={value}
            onChange={handleChange}
            disabled={disabled || loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            placeholder="98765 43210"
            className={cn(
              "flex h-11 w-full bg-transparent px-3 py-2 text-sm text-body placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
              error && "border-danger",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-danger font-medium" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
