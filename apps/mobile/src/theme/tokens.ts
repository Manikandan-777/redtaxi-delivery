/**
 * RedTaxi Mobile Theme Tokens
 * Direct re-export of @redtaxi/shared tokens (Task 2.1 / T2.1)
 */
import {
  colors as sharedColors,
  spacing,
  radius as sharedRadius,
  minTouchTarget,
} from "@redtaxi/shared";

export const mobileColors = {
  ...sharedColors,
  primary: sharedColors.accent,
  secondary: sharedColors.surface,
  border: sharedColors.muted,
} as const;

export const mobileRadius = {
  ...sharedRadius,
  full: sharedRadius.pill,
} as const;

export { mobileColors as colors, spacing, mobileRadius as radius, minTouchTarget };

export const theme = {
  colors: mobileColors,
  spacing,
  radius: mobileRadius,
  minTouchTarget,
  typography: {
    fontFamily: "Inter_400Regular",
    fontFamilyMedium: "Inter_500Medium",
    fontFamilySemiBold: "Inter_600SemiBold",
    fontFamilyBold: "Inter_700Bold",
    sizes: {
      caption: 11,
      body: 14,
      label: 14,
      title: 16,
      screenTitle: 20,
      bigNumber: 32,
    },
  },
} as const;

export default theme;
