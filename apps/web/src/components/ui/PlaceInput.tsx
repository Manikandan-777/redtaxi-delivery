import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface PlaceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  iconType?: "pickup" | "drop";
  error?: string;
  onClear?: () => void;
}

export const PlaceInput = forwardRef<HTMLInputElement, PlaceInputProps>(
  (
    { className, label, iconType = "pickup", value, error, onClear, disabled, id, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <div
            className="absolute left-3.5 flex items-center pointer-events-none"
            aria-hidden="true"
          >
            {iconType === "pickup" ? (
              <span className="h-3 w-3 rounded-full bg-accent ring-4 ring-surface/40" />
            ) : (
              <span className="h-3 w-3 rounded-full bg-danger ring-4 ring-danger/20" />
            )}
          </div>
          <input
            id={inputId}
            ref={ref}
            type="text"
            value={value}
            disabled={disabled}
            aria-label={
              label ? undefined : iconType === "pickup" ? "Pickup location" : "Drop location"
            }
            className={cn(
              "flex h-11 w-full rounded-md border bg-white pl-10 pr-9 py-2 text-sm text-body transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
              error
                ? "border-danger focus-visible:ring-danger"
                : "border-muted/50 hover:border-muted",
              className
            )}
            {...props}
          />
          {Boolean(value) && onClear && !disabled && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear location"
              className="absolute right-3 text-muted hover:text-ink p-1 rounded-full transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PlaceInput.displayName = "PlaceInput";
