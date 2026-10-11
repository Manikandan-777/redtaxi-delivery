/**
 * RedTaxi Design System Tokens
 * Source of truth for web (Tailwind) and mobile (React Native)
 */

export const colors = {
  // Brand
  accent: "#6969EF", // primary buttons, active tabs, links
  accentLight: "#7D7DFF", // hover / active secondary
  "accent-soft": "#7D7DFF", // web spec alias
  accentSoft: "#7D7DFF",
  surface: "#D3D3FF", // tinted cards, icon tiles
  bgDark: "#C6C6FF", // darker background tint
  "bg-dark": "#C6C6FF",

  // Neutral
  background: "#F5F6F4", // app page background
  white: "#FFFFFF",
  ink: "#000344", // headings / primary text
  text: "#000344", // mobile spec alias
  body: "#424242", // body copy
  textBody: "#424242", // mobile spec alias
  muted: "#A6A7BE", // subtle text / borders
  textSecondary: "#A6A7BE", // mobile spec alias

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

export const minTouchTarget = 44; // WCAG 2.5.5 / mobile spec §1.3 (44x44 pt)

/**
 * WCAG 2.1 Relative Luminance and Contrast Ratio calculation
 */
function sRgbToLinear(c: number): number {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}
