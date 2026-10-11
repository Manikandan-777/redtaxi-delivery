import React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { colors, radius } from "../theme/tokens";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, elevated = false, style, ...props }) => {
  return (
    <View style={[styles.card, elevated ? styles.elevated : styles.flat, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginVertical: 6,
  },
  flat: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});
