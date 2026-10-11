import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
    env: {
      SESSION_SECRET: "test-only-secret-key-that-is-at-least-32-chars",
      NODE_ENV: "test",
    },
  },
});
