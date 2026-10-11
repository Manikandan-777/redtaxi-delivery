import React from "react";
import { View, Text, StyleSheet, type DimensionValue } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface BarDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarDatum[];
  height?: number;
  barColor?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 140,
  barColor = colors.primary,
}) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const barHeightPct: DimensionValue = `${Math.round((item.value / maxValue) * 100)}%`;
          return (
            <View key={index} style={styles.barCol}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height: barHeightPct, backgroundColor: barColor }]} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
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
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: 14,
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: "500",
  },
});
