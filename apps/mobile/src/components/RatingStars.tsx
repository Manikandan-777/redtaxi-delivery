import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, minTouchTarget } from "../theme/tokens";

export interface RatingStarsProps {
  rating: number; // 1 to 5
  maxStars?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  interactive = false,
  onRatingChange,
  size = 22,
}) => {
  return (
    <View style={styles.container} accessibilityRole="radiogroup">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= rating;

        const starElement = (
          <Text style={[styles.star, { fontSize: size }, filled ? styles.filled : styles.empty]}>
            ★
          </Text>
        );

        if (interactive) {
          return (
            <Pressable
              key={index}
              accessibilityRole="radio"
              accessibilityLabel={`${starValue} stars`}
              accessibilityState={{ checked: filled }}
              onPress={() => onRatingChange?.(starValue)}
              style={styles.touchArea}
            >
              {starElement}
            </Pressable>
          );
        }

        return <View key={index}>{starElement}</View>;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  touchArea: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  star: {
    textAlign: "center",
  },
  filled: {
    color: colors.secondary,
  },
  empty: {
    color: "#D1D5DB",
  },
});
