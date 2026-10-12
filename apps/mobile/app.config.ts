import type { ExpoConfig, ConfigContext } from "expo/config";
import { z } from "zod";

// ── Env schema ────────────────────────────────────────────────────────────────
// Validated at Expo CLI start time (not during tsc --noEmit).
// Missing values produce a clear error instead of a silent runtime crash.

const envSchema = z.object({
  APP_VARIANT: z.enum(["passenger", "driver", "admin"]).default("passenger"),
  // SC-D6: API URL is public (no secret); secrets go in EAS Secrets, not here.
  EXPO_PUBLIC_API_URL: z.string().url().optional(),
  EXPO_PUBLIC_WS_URL: z.string().optional(),
});

type AppVariant = z.infer<typeof envSchema>["APP_VARIANT"];

// Parse at config time; on error log and fall back to passenger defaults.
// (Expo CLI will show the config object, so the error is visible in the console.)
const envResult = envSchema.safeParse(process.env);
const variant: AppVariant = envResult.success ? envResult.data.APP_VARIANT : "passenger";

// ── Variant helpers ───────────────────────────────────────────────────────────

const APP_NAMES: Record<AppVariant, string> = {
  passenger: "RedTaxi",
  driver: "RedTaxi Driver",
  admin: "RedTaxi Admin",
};

const BUNDLE_IDS: Record<AppVariant, string> = {
  passenger: "com.redtaxi.passenger",
  driver: "com.redtaxi.driver",
  admin: "com.redtaxi.admin",
};

// ── Expo config ───────────────────────────────────────────────────────────────

export default function config({ config: baseConfig }: ConfigContext): ExpoConfig {
  if (!envResult.success) {
    console.warn("⚠ app.config.ts: invalid env vars:", envResult.error.flatten().fieldErrors);
  }

  return {
    ...baseConfig,
    name: APP_NAMES[variant],
    slug: `redtaxi-${variant}`,
    version: "1.0.0",
    orientation: "portrait",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: BUNDLE_IDS[variant],
      // Phase 6 — DEC-16: certificate pinning declined for v1 (SC-G5)
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "RedTaxi needs your location to navigate you to passenger pickups and drops accurately.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "RedTaxi requires background location updates while you are actively online and driving so passengers can track ride progress.",
        NSCameraUsageDescription:
          "RedTaxi uses your camera to upload driving license, RC, and insurance documents for verification.",
        NSPhotoLibraryUsageDescription:
          "RedTaxi accesses your photos so you can select document files for verification.",
      },
    },
    android: {
      package: BUNDLE_IDS[variant],
      adaptiveIcon: {
        backgroundColor: "#6969EF",
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "POST_NOTIFICATIONS",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
      ],
    },
    plugins: ["expo-router"],
    experiments: {
      typedRoutes: true,
    },
  };
}
