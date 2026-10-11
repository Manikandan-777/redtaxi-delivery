import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  delta,
  deltaType = "neutral",
}) => {
  const getDeltaColor = () => {
    switch (deltaType) {
      case "positive":
        return "#166534";
      case "negative":
        return "#991B1B";
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {delta ? <Text style={[styles.delta, { color: getDeltaColor() }]}>{delta}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.ink,
  },
  delta: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
