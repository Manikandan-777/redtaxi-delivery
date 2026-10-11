import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type PressableProps,
} from "react-native";
import { colors, radius, minTouchTarget } from "../theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let bg: string = colors.primary;
    let borderColor: string = "transparent";
    let borderWidth = 0;

    switch (variant) {
      case "primary":
        bg = pressed ? "#B01E22" : colors.primary;
        break;
      case "secondary":
        bg = pressed ? "#E8BE3B" : colors.secondary;
        break;
      case "danger":
        bg = pressed ? "#B81D24" : colors.danger;
        break;
      case "outline":
        bg = pressed ? colors.border : "transparent";
        borderColor = colors.border;
        borderWidth = 1.5;
        break;
      case "ghost":
        bg = pressed ? colors.border : "transparent";
        break;
    }

    if (isDisabled) {
      bg = variant === "outline" || variant === "ghost" ? "transparent" : "#D1D5DB";
      if (variant === "outline") borderColor = "#D1D5DB";
    }

    const minHeight = size === "sm" ? Math.max(minTouchTarget, 44) : size === "lg" ? 56 : 48;
    const paddingHorizontal = size === "sm" ? 14 : size === "lg" ? 24 : 18;

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth,
      minHeight,
      minWidth: Math.max(minTouchTarget, 44),
      paddingHorizontal,
      alignSelf: fullWidth ? "stretch" : "flex-start",
      opacity: isDisabled ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    if (isDisabled) return "#6B7280";
    switch (variant) {
      case "primary":
      case "danger":
        return "#FFFFFF";
      case "secondary":
        return colors.ink;
      case "outline":
      case "ghost":
        return colors.ink;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.base, getContainerStyle(pressed), style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#FFFFFF" : colors.ink}
        />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
