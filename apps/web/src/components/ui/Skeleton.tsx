import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded",
    rectangular: "rounded-md",
    circular: "rounded-full",
  };

  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse bg-muted/20", variantStyles[variant], className)}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};
