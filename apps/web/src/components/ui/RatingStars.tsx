import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface RatingStarsProps {
  value: number;
  max?: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  max = 5,
  onChange,
  readonly = false,
  size = "md",
  className,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4 text-xs",
    md: "w-6 h-6 text-base",
    lg: "w-8 h-8 text-xl",
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      role={readonly ? "img" : "radiogroup"}
      aria-label={`Rating: ${value} of ${max} stars`}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starNum = i + 1;
        const isFilled = starNum <= displayValue;

        if (readonly) {
          return (
            <span
              key={starNum}
              aria-hidden="true"
              className={cn(
                "select-none transition-colors",
                starSizes[size],
                isFilled ? "text-star" : "text-muted/40"
              )}
            >
              ★
            </span>
          );
        }

        return (
          <button
            key={starNum}
            type="button"
            role="radio"
            aria-checked={starNum === value}
            aria-label={`${starNum} star${starNum > 1 ? "s" : ""}`}
            onMouseEnter={() => setHoverValue(starNum)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => onChange?.(starNum)}
            className={cn(
              "select-none p-0.5 rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              starSizes[size],
              isFilled ? "text-star" : "text-muted/40"
            )}
          >
            ★
          </button>
        );
      })}
    </div>
  );
};
