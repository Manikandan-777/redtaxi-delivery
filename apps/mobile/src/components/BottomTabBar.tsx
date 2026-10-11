import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, minTouchTarget } from "../theme/tokens";

export interface TabRoute {
  key: string;
  title: string;
  icon: string;
  badge?: number;
}

export interface BottomTabBarProps {
  routes: TabRoute[];
  currentIndex: number;
  onTabPress: (index: number) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ routes, currentIndex, onTabPress }) => {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {routes.map((route, index) => {
        const isFocused = currentIndex === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={route.title}
            onPress={() => onTabPress(index)}
            style={styles.tab}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, isFocused ? styles.iconActive : null]}>{route.icon}</Text>
              {route.badge !== undefined && route.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{route.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isFocused ? styles.labelActive : null]}>{route.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    minHeight: Math.max(minTouchTarget, 56),
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
  },
  iconContainer: {
    position: "relative",
  },
  icon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  iconActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
