import { Stack } from "expo-router";

/**
 * Root layout — Phase 0 scaffold.
 * Phase 3 adds the auth gate (token check → onboarding/login/home routing).
 * Phase 2 wraps with ThemeProvider and global error boundary.
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
