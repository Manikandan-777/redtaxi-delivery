import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/tokens";
import { inr, type Paise } from "@redtaxi/shared";

export interface FareRowProps {
  label: string;
  amount: Paise;
  isTotal?: boolean;
  subtext?: string;
}

export const FareRow: React.FC<FareRowProps> = ({ label, amount, isTotal = false, subtext }) => {
  return (
    <View style={[styles.container, isTotal ? styles.totalContainer : null]}>
      <View style={styles.labelCol}>
        <Text style={[styles.label, isTotal ? styles.totalLabel : null]}>{label}</Text>
        {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      </View>
      <Text style={[styles.amount, isTotal ? styles.totalAmount : null]}>{inr(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  labelCol: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 14,
    color: colors.ink,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  subtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
});
