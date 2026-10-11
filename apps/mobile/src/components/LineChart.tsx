import React from "react";
import { View, Text, StyleSheet, type DimensionValue } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface LinePoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LinePoint[];
  height?: number;
  lineColor?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 140,
  lineColor = colors.accent,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartArea}>
        {data.map((point, index) => {
          const bottomPct: DimensionValue = `${Math.round((point.value / maxValue) * 75)}%`;
          return (
            <View key={index} style={styles.pointCol}>
              <View style={[styles.dotWrapper, { bottom: bottomPct }]}>
                <View style={[styles.dot, { backgroundColor: lineColor }]} />
              </View>
              <Text style={styles.label}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  chartArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  pointCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    position: "relative",
  },
  dotWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    position: "absolute",
    bottom: 0,
    fontWeight: "500",
  },
});
