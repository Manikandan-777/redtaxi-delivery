import { z } from "zod";

/**
 * Application environment schema.
 *
 * Security rules:
 *   SC-D6 — NEXT_PUBLIC_* variables must never hold secrets (API keys that have
 *           backend access, session secrets, Razorpay secret key, etc.).
 *           Secrets stay in non-public vars (SESSION_SECRET, API_INTERNAL_URL,
 *           RAZORPAY_SECRET_KEY). Public vars hold only client-safe identifiers
 *           that are restricted by HTTP referrer or app-restriction at the provider.
 */
const schema = z.object({
  // ── Runtime environment ────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // ── Server-only secrets (never in NEXT_PUBLIC_*) ──────────────────────────
  /** HttpOnly session cookie signing key (≥ 32 chars). Boot fails if missing. */
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be ≥ 32 characters"),

  /** Internal URL the BFF uses to talk to the backend API (server-to-server). */
  API_INTERNAL_URL: z.string().url().optional(),

  /** Razorpay secret key — server-only, used to verify payment signatures. */
  RAZORPAY_SECRET_KEY: z.string().optional(),

  // ── Client-safe public vars (restricted keys only) ────────────────────────
  /** Google Maps API key — restricted to HTTP referrer in Google Cloud console. */
  NEXT_PUBLIC_MAPS_KEY: z.string().optional(),

  /** Public base URL of this app (used in OG tags, canonical links, etc.). */
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  /** Razorpay key ID — public, used only to initialise Razorpay Checkout on client. */
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  /** WebSocket URL for the real-time server (mock or real). */
  NEXT_PUBLIC_WS_URL: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/**
 * Validate an environment record. Throws with a descriptive error on failure.
 *
 * Pass `process.env` (default) for production or a custom record in unit tests
 * so tests can exercise validation rules without modifying `process.env` globally.
 */
export function validateEnv(
  raw: Record<string, string | undefined> = process.env
): Env {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(errors, null, 2)}`
    );
  }
  return result.data;
}

/**
 * The validated runtime environment.
 * Throws at module load time if required variables are missing or invalid,
 * which causes the Next.js server to refuse to start (T0.4).
 */
export const env = validateEnv();
