import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  type ViewProps,
  StatusBar,
} from "react-native";
import { colors } from "../theme/tokens";

export interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  backgroundColor?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  backgroundColor = colors.background,
  style,
  ...props
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={[styles.container, style]}
          keyboardShouldPersistTaps="handled"
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, style]} {...props}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
