import { StyleSheet, Text, View } from "react-native";

/**
 * MP4 Home screen — Phase 0 placeholder.
 * Phase 4 builds the real home screen: header, search, Quick Access,
 * promo banner, and location permission handling.
 * @see IMPLEMENTATION.md §Phase 4, task 4.9
 */
import { inr } from "@redtaxi/shared";

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RedTaxi</Text>
      <Text style={styles.subtitle}>Fares starting from {inr(149400)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F6F4",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000344",
  },
  subtitle: {
    fontSize: 14,
    color: "#A6A7BE",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
