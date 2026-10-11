import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { colors, minTouchTarget } from "../theme/tokens";

export interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  description?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  value,
  onValueChange,
  description,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.label, disabled ? styles.textDisabled : null]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, disabled ? styles.textDisabled : null]}>
            {description}
          </Text>
        ) : null}
      </View>
      <View style={styles.switchContainer}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#D1D5DB", true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: Math.max(minTouchTarget, 50),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textDisabled: {
    opacity: 0.5,
  },
  switchContainer: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
});
