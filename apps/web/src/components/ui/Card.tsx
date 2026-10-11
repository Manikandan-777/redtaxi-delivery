import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "tinted" | "interactive";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-white border border-muted/30 shadow-sm",
      tinted: "bg-surface/30 border border-surface shadow-sm",
      interactive:
        "bg-white border border-muted/30 shadow-sm hover:shadow-md hover:border-accent/40 cursor-pointer transition-all",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl p-5 text-body", variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
