import React from "react";
import { cn } from "@/lib/utils";

export interface DayData {
  day: string;
  trips: number;
}

export interface BarChartWeekProps {
  data: DayData[];
  title?: string;
  className?: string;
}

export const BarChartWeek: React.FC<BarChartWeekProps> = ({
  data,
  title = "Trips Completed This Week",
  className,
}) => {
  const maxTrips = Math.max(...data.map((d) => d.trips), 1);

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "rounded-xl bg-white border border-muted/30 p-5 shadow-sm flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <span className="text-xs text-muted">
          Total: {data.reduce((a, b) => a + b.trips, 0)} trips
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 h-40 pt-4 px-2">
        {data.map((item) => {
          const heightPercent = Math.round((item.trips / maxTrips) * 100);
          return (
            <div
              key={item.day}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
            >
              <div className="w-full flex items-end justify-center h-28">
                <div
                  className="w-full max-w-[28px] bg-accent hover:bg-accent-soft rounded-t-md transition-all relative group flex justify-center"
                  style={{ height: `${Math.max(heightPercent, 8)}%` }}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-ink text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none">
                    {item.trips}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-muted select-none">{item.day}</span>
            </div>
          );
        })}
      </div>

      {/* Accessible Table Fallback (T6.10 / WCAG) */}
      <table className="sr-only" aria-label={`${title} Data Table`}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Trips</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.day}>
              <td>{item.day}</td>
              <td>{item.trips}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export interface RevenueDataPoint {
  label: string;
  amount: number;
}

export interface RevenueLineProps {
  data: RevenueDataPoint[];
  title?: string;
  className?: string;
}

export const RevenueLine: React.FC<RevenueLineProps> = ({
  data,
  title = "Revenue Overview",
  className,
}) => {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const minAmount = Math.min(...data.map((d) => d.amount), 0);
  const range = maxAmount - minAmount || 1;

  // Build SVG polyline points in viewBox 0 0 300 100
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * 280 + 10;
      const y = 90 - ((d.amount - minAmount) / range) * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "rounded-xl bg-white border border-muted/30 p-5 shadow-sm flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
      </div>

      <div className="h-36 w-full pt-2">
        <svg viewBox="0 0 300 100" className="w-full h-28 overflow-visible">
          <polyline
            fill="none"
            stroke="#6969EF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * 280 + 10;
            const y = 90 - ((d.amount - minAmount) / range) * 80;
            return (
              <circle key={i} cx={x} cy={y} r="4" fill="#50FF97" stroke="#6969EF" strokeWidth="2" />
            );
          })}
        </svg>
        <div className="flex justify-between text-xs text-muted mt-2 px-1">
          {data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
