import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";
import type { BookingStatus, ApprovalStatus } from "@redtaxi/shared";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent" | "surface";

export interface StatusBadgeProps {
  status: BookingStatus | ApprovalStatus | string;
  variant?: BadgeVariant;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant: customVariant,
  label: customLabel,
}) => {
  const getBadgeConfig = (s: string): { variant: BadgeVariant; label: string } => {
    switch (s) {
      case "completed":
      case "approved":
        return { variant: "success", label: s === "completed" ? "Completed" : "Approved" };
      case "searching":
      case "driver_assigned":
      case "driver_arriving":
      case "driver_arrived":
      case "in_progress":
      case "pending":
      case "scheduled":
        return {
          variant: "warning",
          label:
            s === "in_progress"
              ? "In Progress"
              : s === "driver_assigned"
                ? "Driver Assigned"
                : s === "driver_arriving"
                  ? "Driver Arriving"
                  : s === "driver_arrived"
                    ? "Driver Arrived"
                    : s.charAt(0).toUpperCase() + s.slice(1),
        };
      case "cancelled":
      case "rejected":
        return { variant: "danger", label: s === "cancelled" ? "Cancelled" : "Rejected" };
      case "created":
        return { variant: "accent", label: "Created" };
      default:
        return { variant: "default", label: s };
    }
  };

  const config = getBadgeConfig(status);
  const variant = customVariant || config.variant;
  const label = customLabel || config.label;

  const getStyle = () => {
    switch (variant) {
      case "success":
        return { bg: "#DCFCE7", text: "#166534", border: "#86EFAC" };
      case "warning":
        return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
      case "danger":
        return { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" };
      case "accent":
        return { bg: "#EFF6FF", text: colors.accent, border: "#BFDBFE" };
      default:
        return { bg: "#F3F4F6", text: colors.ink, border: colors.border };
    }
  };

  const colorsConfig = getStyle();

  return (
    <View
      style={[styles.badge, { backgroundColor: colorsConfig.bg, borderColor: colorsConfig.border }]}
    >
      <Text style={[styles.text, { color: colorsConfig.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
