/**
 * RedTaxi Design System Tokens
 * Source of truth for web (Tailwind) and mobile (React Native)
 */

export const colors = {
  // Brand
  accent: "#6969EF", // primary buttons, active tabs, links
  accentLight: "#7D7DFF", // hover / active secondary
  surface: "#D3D3FF", // tinted cards, icon tiles
  bgDark: "#C6C6FF", // darker background tint

  // Neutral
  background: "#F5F6F4", // app page background
  white: "#FFFFFF",
  ink: "#000344", // headings / primary text
  body: "#424242", // body copy
  muted: "#A6A7BE", // subtle text / borders

  // Semantic (DEC-11 confirmed)
  success: "#50FF97", // online, verified, completed
  danger: "#E5484D", // SOS, cancel, errors, decline
  warning: "#F5A524", // pending, alerts
  star: "#FFB400", // ratings
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 9999,
} as const;
