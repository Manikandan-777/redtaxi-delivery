import { describe, it, expect } from "vitest";
import { validateEnv } from "./env";

/**
 * Gate 0 — T0.4: Env validation unit tests.
 *
 * vitest.config.ts sets SESSION_SECRET in test.env so the module-level
 * `export const env = validateEnv()` succeeds when this file is loaded.
 * These tests exercise validateEnv() directly, passing custom records,
 * so they are isolated from process.env.
 */
describe("env validation (T0.4)", () => {
  // gitleaks:allow
  const VALID_SECRET = "test_env_dummy_session_secret_min_32_characters_long";

  // ── Missing required vars ──────────────────────────────────────────────────

  it("throws when SESSION_SECRET is absent", () => {
    expect(() => validateEnv({})).toThrow("Invalid environment variables");
  });

  it("throws when SESSION_SECRET is present but shorter than 32 characters", () => {
    expect(() => validateEnv({ SESSION_SECRET: "too-short" })).toThrow(
      "Invalid environment variables"
    );
  });

  it("throws when SESSION_SECRET is exactly 31 characters (boundary)", () => {
    expect(() =>
      validateEnv({ SESSION_SECRET: "x".repeat(31) })
    ).toThrow("Invalid environment variables");
  });

  // ── Valid inputs ───────────────────────────────────────────────────────────

  it("succeeds when SESSION_SECRET is exactly 32 characters (boundary)", () => {
    const result = validateEnv({ SESSION_SECRET: "x".repeat(32) });
    expect(result.SESSION_SECRET).toBe("x".repeat(32));
  });

  it("succeeds with all required vars present", () => {
    const result = validateEnv({ SESSION_SECRET: VALID_SECRET });
    expect(result.SESSION_SECRET).toBe(VALID_SECRET);
  });

  it("defaults NODE_ENV to 'development' when not provided", () => {
    const result = validateEnv({ SESSION_SECRET: VALID_SECRET });
    expect(result.NODE_ENV).toBe("development");
  });

  // ── SC-D6: no secrets in NEXT_PUBLIC_* ────────────────────────────────────

  it("SC-D6: SESSION_SECRET is not accessible via NEXT_PUBLIC_SESSION_SECRET", () => {
    const result = validateEnv({ SESSION_SECRET: VALID_SECRET });
    // The schema has no NEXT_PUBLIC_SESSION_SECRET field — any such env var is
    // stripped (not forwarded to the client). Verify the type has no such key.
    expect(Object.keys(result)).not.toContain("NEXT_PUBLIC_SESSION_SECRET");
  });

  it("SC-D6: RAZORPAY_SECRET_KEY is not a NEXT_PUBLIC_* variable", () => {
    // Must not be in NEXT_PUBLIC_* — the schema keeps it as RAZORPAY_SECRET_KEY.
    const result = validateEnv({
      SESSION_SECRET: VALID_SECRET,
      RAZORPAY_SECRET_KEY: "rzp_test_secret_key",
    });
    expect(Object.keys(result)).not.toContain("NEXT_PUBLIC_RAZORPAY_SECRET_KEY");
    expect(result.RAZORPAY_SECRET_KEY).toBe("rzp_test_secret_key");
  });

  // ── Optional public vars ───────────────────────────────────────────────────

  it("rejects an invalid NEXT_PUBLIC_APP_URL", () => {
    expect(() =>
      validateEnv({ SESSION_SECRET: VALID_SECRET, NEXT_PUBLIC_APP_URL: "not-a-url" })
    ).toThrow("Invalid environment variables");
  });

  it("accepts a valid NEXT_PUBLIC_APP_URL", () => {
    const result = validateEnv({
      SESSION_SECRET: VALID_SECRET,
      NEXT_PUBLIC_APP_URL: "https://redtaxi.example.com",
    });
    expect(result.NEXT_PUBLIC_APP_URL).toBe("https://redtaxi.example.com");
  });
});
