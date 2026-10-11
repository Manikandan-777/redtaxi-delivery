import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";

export interface TimelineStep {
  title: string;
  description?: string;
  time?: string;
  status: "completed" | "current" | "upcoming";
}

export interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.stepRow}>
            <View style={styles.indicatorCol}>
              <View
                style={[
                  styles.node,
                  step.status === "completed"
                    ? styles.nodeCompleted
                    : step.status === "current"
                      ? styles.nodeCurrent
                      : styles.nodeUpcoming,
                ]}
              >
                {step.status === "completed" ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.connector,
                    step.status === "completed"
                      ? styles.connectorCompleted
                      : styles.connectorUpcoming,
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.contentCol}>
              <View style={styles.headerRow}>
                <Text
                  style={[styles.title, step.status === "current" ? styles.titleCurrent : null]}
                >
                  {step.title}
                </Text>
                {step.time ? <Text style={styles.time}>{step.time}</Text> : null}
              </View>
              {step.description ? <Text style={styles.description}>{step.description}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 52,
  },
  indicatorCol: {
    alignItems: "center",
    width: 28,
  },
  node: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  nodeCompleted: {
    backgroundColor: "#166534",
  },
  nodeCurrent: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  nodeUpcoming: {
    backgroundColor: "#E5E7EB",
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  connector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: "#166534",
  },
  connectorUpcoming: {
    backgroundColor: "#E5E7EB",
  },
  contentCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  titleCurrent: {
    color: colors.primary,
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
