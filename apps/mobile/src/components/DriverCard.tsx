import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radius, minTouchTarget } from "../theme/tokens";

export interface DriverCardProps {
  name: string;
  rating: number;
  vehicleModel: string;
  plateNumber: string;
  phone?: string;
  onCall?: () => void;
  onChat?: () => void;
}

export const DriverCard: React.FC<DriverCardProps> = ({
  name,
  rating,
  vehicleModel,
  plateNumber,
  onCall,
  onChat,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.vehicleText}>{vehicleModel}</Text>
          </View>
        </View>
        <View style={styles.plateContainer}>
          <Text style={styles.plateText}>{plateNumber}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onCall ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call Driver"
            onPress={onCall}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.callBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.callBtnText}>Call Driver</Text>
          </Pressable>
        ) : null}
        {onChat ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chat with Driver"
            onPress={onChat}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.chatBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.chatBtnText}>Chat</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  star: {
    color: colors.secondary,
    fontSize: 14,
    marginRight: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  dot: {
    marginHorizontal: 6,
    color: colors.textSecondary,
  },
  vehicleText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  plateContainer: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  plateText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    minHeight: Math.max(minTouchTarget, 44),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
  },
  callBtn: {
    backgroundColor: colors.primary,
  },
  callBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  chatBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chatBtnText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.8,
  },
});
