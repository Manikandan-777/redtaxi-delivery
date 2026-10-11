import React, { useRef } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { colors, radius, minTouchTarget } from "../theme/tokens";

export interface OtpBoxesProps {
  length?: 4 | 6;
  value: string;
  onChangeText: (code: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OtpBoxes: React.FC<OtpBoxesProps> = ({
  length = 6,
  value,
  onChangeText,
  error,
  disabled = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const digits = value.split("").slice(0, length);

  const handlePress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={styles.boxesRow}
        accessibilityRole="button"
        accessibilityLabel="Enter verification code"
      >
        {Array.from({ length }).map((_, index) => {
          const char = digits[index] || "";
          const isFocused = !disabled && digits.length === index;
          return (
            <View
              key={index}
              style={[
                styles.box,
                isFocused ? styles.boxFocused : null,
                char ? styles.boxFilled : null,
                error ? styles.boxError : null,
                disabled ? styles.boxDisabled : null,
              ]}
            >
              <Text style={styles.boxText}>{char}</Text>
            </View>
          );
        })}
      </Pressable>

      {/* Hidden real input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const sanitized = text.replace(/\D/g, "").slice(0, length);
          onChangeText(sanitized);
        }}
        keyboardType="number-pad"
        maxLength={length}
        editable={!disabled}
        style={styles.hiddenInput}
        aria-hidden={true}
      />

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
    marginVertical: 12,
    alignItems: "center",
  },
  boxesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  box: {
    width: Math.max(minTouchTarget, 46),
    height: Math.max(minTouchTarget, 52),
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  boxFocused: {
    borderColor: colors.accent,
  },
  boxFilled: {
    borderColor: colors.ink,
  },
  boxError: {
    borderColor: colors.danger,
  },
  boxDisabled: {
    backgroundColor: "#F3F4F6",
  },
  boxText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 8,
    fontWeight: "500",
  },
});
