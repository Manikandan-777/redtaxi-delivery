import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, minTouchTarget } from "../theme/tokens";

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leftIcon,
  rightElement,
  onPress,
  destructive = false,
}) => {
  const content = (
    <View style={styles.container}>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      <View style={styles.textContainer}>
        <Text style={[styles.title, destructive ? styles.destructiveText : null]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement ? (
        <View style={styles.rightElement}>{rightElement}</View>
      ) : onPress ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
};

const styles = StyleSheet.create({
  pressable: {
    minHeight: Math.max(minTouchTarget, 52),
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: "#F9FAFB",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  destructiveText: {
    color: colors.danger,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: 10,
    justifyContent: "center",
  },
  chevron: {
    fontSize: 22,
    color: "#9CA3AF",
    marginLeft: 8,
  },
});
