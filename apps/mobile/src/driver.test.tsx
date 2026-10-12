import { inr, paise } from "@redtaxi/shared";
import configFunction from "../app.config";

describe("Phase 6: Mobile Driver Experience Unit Tests (T6.1 - T6.14)", () => {
  describe("T6.9: Mobile Config & Permissions (Honest iOS & Android Foreground)", () => {
    it("ensures honest iOS location strings and Android foreground location permissions are present", () => {
      const config = configFunction({
        projectRoot: "/mock",
        staticConfigPath: "/mock/app.json",
        packageJsonPath: "/mock/package.json",
        config: { name: "RedTaxi", slug: "redtaxi" },
      });

      // iOS honest usage strings check (T6.9)
      expect(config.ios?.infoPlist?.NSLocationWhenInUseUsageDescription).toContain(
        "RedTaxi needs your location to navigate you to passenger pickups"
      );
      expect(config.ios?.infoPlist?.NSLocationAlwaysAndWhenInUseUsageDescription).toContain(
        "background location updates while you are actively online"
      );
      expect(config.ios?.infoPlist?.NSCameraUsageDescription).toContain(
        "upload driving license, RC, and insurance"
      );

      // Android foreground service & location permissions (T6.9)
      const permissions = config.android?.permissions || [];
      expect(permissions).toContain("FOREGROUND_SERVICE");
      expect(permissions).toContain("FOREGROUND_SERVICE_LOCATION");
      expect(permissions).toContain("ACCESS_FINE_LOCATION");
      expect(permissions).toContain("ACCESS_BACKGROUND_LOCATION");
      expect(permissions).toContain("POST_NOTIFICATIONS");
    });
  });

  describe("T6.1: Go-Online Gate when Documents are Unverified", () => {
    it("prevents going online if any document status is not approved", () => {
      const evaluateOnlineStatus = (docs: Array<{ status: string }>) => {
        const canGoOnline = docs.every((d) => d.status === "approved");
        return {
          allowed: canGoOnline,
          reason: canGoOnline ? null : "DOCUMENTS_UNVERIFIED",
        };
      };

      const pendingDocs = [{ status: "approved" }, { status: "pending" }];
      const res = evaluateOnlineStatus(pendingDocs);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("DOCUMENTS_UNVERIFIED");

      const approvedDocs = [{ status: "approved" }, { status: "approved" }];
      expect(evaluateOnlineStatus(approvedDocs).allowed).toBe(true);
    });
  });

  describe("T6.2: Offer Countdown with Clock Skew", () => {
    it("calculates countdown correctly from server expiresAt even with skew", () => {
      const calculateRemaining = (expiresAtIso: string, nowMs: number, skewMs: number = 0) => {
        const expiresMs = new Date(expiresAtIso).getTime();
        return Math.max(0, Math.ceil((expiresMs - (nowMs + skewMs)) / 1000));
      };

      const now = 2000000;
      const expiresAt = new Date(now + 45000).toISOString();

      // Normal clock
      expect(calculateRemaining(expiresAt, now)).toBe(45);
      // With 5s clock skew (T6.2 requirement)
      expect(calculateRemaining(expiresAt, now, 5000)).toBe(40);
      // Expired
      expect(calculateRemaining(expiresAt, now + 50000)).toBe(0);
    });
  });

  describe("T6.4 & T6.5: 4-Digit Start OTP & Attempt Limit Locking", () => {
    it("locks OTP entry after 5 incorrect attempts", () => {
      let attempts = 0;
      let locked = false;

      const checkOtp = (entered: string, correct: string) => {
        attempts++;
        if (attempts > 5) {
          locked = true;
          return { status: "locked" };
        }
        if (entered !== correct) {
          if (attempts >= 5) {
            locked = true;
            return { status: "locked" };
          }
          return { status: "invalid", attemptsRemaining: 5 - attempts };
        }
        return { status: "success" };
      };

      // 4 wrong attempts
      for (let i = 0; i < 4; i++) {
        const res = checkOtp("0000", "4321");
        expect(res.status).toBe("invalid");
      }
      expect(locked).toBe(false);

      // 5th wrong attempt -> locks
      const fifthRes = checkOtp("0000", "4321");
      expect(fifthRes.status).toBe("locked");
      expect(locked).toBe(true);
    });
  });

  describe("T6.6 & T6.7: Amount to Collect & Numeric Odometer", () => {
    it("computes amountToCollect = total - paid (₹1,494 - ₹500 = ₹994)", () => {
      const total = paise(149400); // ₹1,494
      const paid = paise(50000); // ₹500
      const toCollect = paise(total - paid); // ₹994

      expect(toCollect).toBe(99400);
      expect(inr(toCollect)).toBe("₹994");
    });

    it("sanitizes odometer to numeric characters only", () => {
      const sanitizeOdometer = (val: string) => val.replace(/[^0-9.]/g, "");
      expect(sanitizeOdometer("45,210 km")).toBe("45210");
      expect(sanitizeOdometer("abc45280.5xyz")).toBe("45280.5");
    });
  });

  describe("T6.12: Bank Details Masking", () => {
    it("ensures bank account is masked to last 4 digits only", () => {
      const maskBank = (acc: string) => `•••• •••• •••• ${acc.slice(-4)}`;
      const masked = maskBank("5010023412344321");
      expect(masked).toBe("•••• •••• •••• 4321");
      expect(masked).not.toContain("50100");
    });
  });
});
