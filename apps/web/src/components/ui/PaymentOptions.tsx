import React from "react";
import { cn } from "@/lib/utils";
import { inr, type DepositOption } from "@redtaxi/shared";

export interface PaymentOptionsProps {
  options: DepositOption[];
  selectedType: "deposit" | "full";
  onChange: (type: "deposit" | "full") => void;
  className?: string;
  disabled?: boolean;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  options = [],
  selectedType,
  onChange,
  className,
  disabled = false,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Payment choices"
      className={cn("flex flex-col gap-3", className)}
    >
      {(options || []).map((opt) => {
        const isSelected = opt.type === selectedType;
        return (
          <div
            key={opt.type}
            role="radio"
            aria-checked={isSelected}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && onChange(opt.type)}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onChange(opt.type);
              }
            }}
            className={cn(
              "relative flex items-center justify-between p-4 rounded-xl border bg-white cursor-pointer transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isSelected
                ? "border-accent ring-2 ring-accent/30 bg-surface/10"
                : "border-muted/30 hover:border-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected ? "border-accent bg-accent" : "border-muted"
                )}
              >
                {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink">
                    {opt.type === "deposit" ? "Advance Deposit" : "100% Full Payment"}
                  </span>
                  {opt.recommended && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {opt.type === "deposit"
                    ? `Pay ${inr(opt.payNow)} now • Balance ${inr(opt.payAtDrop)} at drop`
                    : `Pay entire ${inr(opt.payNow)} upfront`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-extrabold text-ink">{inr(opt.payNow)}</span>
              <p className="text-xs text-muted">Pay now</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
