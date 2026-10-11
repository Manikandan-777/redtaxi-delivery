import React from "react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@redtaxi/shared";

export interface TimelineItem {
  status: BookingStatus;
  title: string;
  description?: string;
  time?: string;
  completed?: boolean;
  current?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <div className={cn("flex flex-col gap-0", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors select-none",
                  item.completed
                    ? "bg-success text-ink"
                    : item.current
                      ? "bg-accent text-white ring-4 ring-accent/20"
                      : "bg-muted/30 text-muted"
                )}
              >
                {item.completed ? "✓" : idx + 1}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[32px] my-1",
                    item.completed ? "bg-success/50" : "bg-muted/30"
                  )}
                />
              )}
            </div>
            <div className="pb-5 flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    item.current ? "text-accent" : item.completed ? "text-ink" : "text-muted"
                  )}
                >
                  {item.title}
                </h4>
                {item.time && <span className="text-xs text-muted">{item.time}</span>}
              </div>
              {item.description && (
                <p className="mt-0.5 text-xs text-body leading-relaxed">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
