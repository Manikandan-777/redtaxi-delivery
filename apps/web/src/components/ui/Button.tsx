import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  hasError?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      hasError = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variantStyles = {
      primary:
        "bg-accent text-white hover:bg-accent-soft active:brightness-95 focus-visible:ring-accent",
      outline:
        "border border-accent text-accent bg-transparent hover:bg-surface/30 active:bg-surface/50 focus-visible:ring-accent",
      danger:
        "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 focus-visible:ring-danger",
      ghost: "text-ink hover:bg-surface/40 active:bg-surface/60 focus-visible:ring-accent",
      secondary:
        "bg-surface text-ink hover:bg-surface/80 active:bg-surface/90 focus-visible:ring-accent",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs min-h-[36px]",
      md: "h-11 px-5 text-sm min-h-[44px]", // >= 44px min touch target
      lg: "h-13 px-6 text-base min-h-[48px]",
    };

    const errorStyles = hasError ? "border-2 border-danger" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? "true" : undefined}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], errorStyles, className)}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
