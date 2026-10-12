import React from "react";
import { cn } from "@/lib/utils";

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtext?: string | undefined;
  icon?: React.ReactNode;
  trend?:
    | string
    | {
        value: string;
        isPositive?: boolean;
      }
    | undefined;
  className?: string | undefined;
  "data-testid"?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  className,
  "data-testid": dataTestId,
  ...props
}) => {
  return (
    <div
      data-testid={dataTestId}
      {...props}
      className={cn(
        "rounded-xl bg-white border border-muted/30 p-5 shadow-sm flex flex-col justify-between min-w-[180px]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface/50 text-accent">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold text-ink">{value}</div>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-semibold",
                  typeof trend === "string"
                    ? "text-success"
                    : trend.isPositive
                      ? "text-success"
                      : "text-danger"
                )}
              >
                {typeof trend === "string" ? trend : trend.value}
              </span>
            )}
            {subtext && <span className="text-muted">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
