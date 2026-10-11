import React from "react";
import { cn } from "@/lib/utils";
import { inr, type FareQuote } from "@redtaxi/shared";

export interface FareBreakdownProps {
  quote: FareQuote;
  className?: string;
}

export const FareBreakdown: React.FC<FareBreakdownProps> = ({ quote, className }) => {
  return (
    <div
      className={cn(
        "rounded-xl bg-white border border-muted/30 p-5 shadow-sm flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-muted/20 pb-3">
        <h3 className="text-base font-bold text-ink">Fare Estimate</h3>
        <span className="text-xs text-muted">
          {quote.distanceKm} km • {Math.floor(quote.durationMin / 60)}h {quote.durationMin % 60}m
        </span>
      </div>

      <div className="flex flex-col gap-2.5 py-1 text-sm text-body">
        {quote.lines.map((line) => (
          <div key={line.key} className="flex justify-between items-center">
            <span>{line.label}</span>
            <span className="font-medium text-ink">{inr(line.amount)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-muted/20 pt-3 flex justify-between items-center">
        <div>
          <span className="text-base font-bold text-ink">Total Estimated Fare</span>
          <p className="text-xs text-muted">Includes GST, driver allowance & toll</p>
        </div>
        <span className="text-xl font-extrabold text-accent">{inr(quote.total)}</span>
      </div>
    </div>
  );
};
