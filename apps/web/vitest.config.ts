import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // env.test.ts runs in Node (no DOM needed)
    // Phase 2 component tests override this per-file with @vitest-environment jsdom
    environment: "node",
    globals: false,
    // Provide required env vars so env.ts module-level validation doesn't throw
    // at import time when the test suite loads the module.
    env: {
      SESSION_SECRET: "test-only-secret-key-that-is-at-least-32-chars",
      NODE_ENV: "test",
    },
  },
});
