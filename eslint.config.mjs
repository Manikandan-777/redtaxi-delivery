// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactPlugin from "eslint-plugin-react";

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.expo/**",
      "**/coverage/**",
      // Generated files
      "**/next-env.d.ts",
      // Config files (linted separately if needed)
      "eslint.config.mjs",
    ],
  },

  // ── Base JS rules (applies to all files) ────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript rules (applies to .ts / .tsx files) ──────────────────────────
  ...tseslint.configs.recommended,

  // ── Language options ─────────────────────────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // ── Project-wide rule overrides ──────────────────────────────────────────────
  {
    plugins: {
      react: reactPlugin,
    },
    rules: {
      // Unused variables: allow underscore-prefixed names
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Force `import type` for type-only imports (aligns with isolatedModules)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // Discourage console.log in production code; warn/error/info are fine
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      // SC-H2 & T2.12: dangerouslySetInnerHTML ban — strictly enforced
      "react/no-danger": "error",
    },
  }
);
