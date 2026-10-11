import type { Config } from "tailwindcss";
import { colors } from "@redtaxi/shared";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: colors.accent,
        "accent-soft": colors.accentLight,
        accentLight: colors.accentLight,
        success: colors.success,
        surface: colors.surface,
        "bg-dark": colors.bgDark,
        bgDark: colors.bgDark,
        background: colors.background,
        ink: colors.ink,
        body: colors.body,
        muted: colors.muted,
        white: colors.white,
        danger: colors.danger,
        warning: colors.warning,
        star: colors.star,
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        pill: "9999px",
      },
      screens: {
        sm: "360px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
