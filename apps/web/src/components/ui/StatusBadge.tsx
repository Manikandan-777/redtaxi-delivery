import React from "react";
import { cn } from "@/lib/utils";
import type { BookingStatus, ApprovalStatus } from "@redtaxi/shared";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent" | "surface";

export interface BadgeProps {
  variant?: BadgeVariant | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "default", children, className }) => {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-surface/50 text-ink border-surface",
    success: "bg-success/20 text-ink border-success/40",
    warning: "bg-warning/20 text-ink border-warning/40",
    danger: "bg-danger/15 text-danger border-danger/30",
    accent: "bg-accent/15 text-accent border-accent/30",
    surface: "bg-surface text-ink border-surface",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: BookingStatus | ApprovalStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getBadgeConfig = (s: string): { variant: BadgeVariant; label: string } => {
    switch (s) {
      case "completed":
      case "approved":
      case "verified":
      case "resolved":
        return { variant: "success", label: s.charAt(0).toUpperCase() + s.slice(1) };
      case "scheduled":
      case "searching":
      case "driver_assigned":
      case "driver_arriving":
      case "driver_arrived":
      case "in_progress":
      case "assigned":
        return {
          variant: "accent",
          label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        };
      case "pending":
      case "open":
        return { variant: "warning", label: s.charAt(0).toUpperCase() + s.slice(1) };
      case "cancelled":
      case "rejected":
      case "no_driver":
        return {
          variant: "danger",
          label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        };
      default:
        return { variant: "default", label: s };
    }
  };

  const { variant, label } = getBadgeConfig(status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};
