import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface RouteCardProps {
  pickup: string;
  dropoff: string;
  distanceKm: number;
  durationMin: number;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  pickup,
  dropoff,
  distanceKm,
  durationMin,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.timelineCol}>
        <View style={[styles.dot, styles.pickupDot]} />
        <View style={styles.line} />
        <View style={[styles.dot, styles.dropoffDot]} />
      </View>
      <View style={styles.contentCol}>
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>Pickup</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {pickup}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.addressRow}>
          <Text style={styles.addressLabel}>Drop-off</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {dropoff}
          </Text>
        </View>
        <View style={styles.metricsRow}>
          <Text style={styles.metricText}>
            {distanceKm.toFixed(1)} km • ~{durationMin} mins
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    marginVertical: 6,
  },
  timelineCol: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pickupDot: {
    backgroundColor: "#166534",
  },
  dropoffDot: {
    backgroundColor: colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
  },
  addressRow: {
    marginVertical: 2,
  },
  addressLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  metricsRow: {
    marginTop: 6,
  },
  metricText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
