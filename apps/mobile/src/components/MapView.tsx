import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface MapViewProps {
  markers?: Array<{
    lat: number;
    lng: number;
    label?: string;
    isDriver?: boolean;
  }>;
  height?: number;
}

export const MapView: React.FC<MapViewProps> = ({ markers = [], height = 200 }) => {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.gridOverlay}>
        <Text style={styles.watermark}>MAP VIEW (GPS Active)</Text>
      </View>
      {markers.map((m, idx) => (
        <View
          key={idx}
          style={[
            styles.pin,
            m.isDriver ? styles.driverPin : styles.standardPin,
            { left: `${20 + idx * 30}%`, top: `${30 + idx * 20}%` },
          ]}
        >
          <Text style={styles.pinText}>{m.isDriver ? "🚕" : "📍"}</Text>
          {m.label ? <Text style={styles.pinLabel}>{m.label}</Text> : null}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E5E7EB",
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6,
  },
  gridOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  watermark: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  pin: {
    position: "absolute",
    alignItems: "center",
  },
  standardPin: {},
  driverPin: {},
  pinText: {
    fontSize: 22,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: colors.surface,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
});
