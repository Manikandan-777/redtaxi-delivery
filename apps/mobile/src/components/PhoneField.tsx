import React from "react";
import { View, Text, TextInput, StyleSheet, type ViewStyle } from "react-native";
import { colors, radius, minTouchTarget } from "../theme/tokens";

export interface PhoneFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label = "Phone Number",
  value,
  onChangeText,
  error,
  disabled = false,
  containerStyle,
}) => {
  const handleChange = (raw: string) => {
    // Only allow digits, max 10
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    onChangeText(digits);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[styles.row, error ? styles.rowError : null, disabled ? styles.rowDisabled : null]}
      >
        <View style={styles.prefixContainer}>
          <Text style={styles.prefixText}>+91</Text>
        </View>
        <TextInput
          accessibilityLabel="Phone Number"
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          placeholder="98765 43210"
          placeholderTextColor="#9CA3AF"
          maxLength={10}
          editable={!disabled}
        />
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minHeight: Math.max(minTouchTarget, 48),
    overflow: "hidden",
  },
  rowError: {
    borderColor: colors.danger,
  },
  rowDisabled: {
    backgroundColor: "#F3F4F6",
  },
  prefixContainer: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    minHeight: Math.max(minTouchTarget, 48),
  },
  prefixText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.ink,
    minHeight: Math.max(minTouchTarget, 48),
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: "500",
  },
});
