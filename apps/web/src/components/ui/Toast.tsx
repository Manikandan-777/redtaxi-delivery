import React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  id: string;
  type?: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  onDismiss?: (id: string) => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = "info",
  title,
  message,
  onDismiss,
  className,
}) => {
  const typeStyles = {
    info: "border-accent/40 bg-white text-ink",
    success: "border-success/40 bg-white text-ink",
    warning: "border-warning/40 bg-white text-ink",
    error: "border-danger/40 bg-white text-ink",
  };

  const iconStyles = {
    info: "text-accent",
    success: "text-success",
    warning: "text-warning",
    error: "text-danger",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all",
        typeStyles[type],
        className
      )}
    >
      <div className={cn("mt-0.5 text-base font-bold", iconStyles[type])}>
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "warning" && "!"}
        {type === "info" && "ℹ"}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        {message && <p className="mt-0.5 text-xs text-body leading-relaxed">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
          className="text-muted hover:text-ink text-xs p-1 rounded"
        >
          ✕
        </button>
      )}
    </div>
  );
};
