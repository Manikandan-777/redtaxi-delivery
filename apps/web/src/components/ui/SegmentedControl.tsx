import React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex p-1 bg-surface/30 rounded-lg border border-muted/30 select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all min-h-[38px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isSelected
                ? "bg-accent text-white shadow-sm"
                : "text-body hover:text-ink hover:bg-white/50"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
