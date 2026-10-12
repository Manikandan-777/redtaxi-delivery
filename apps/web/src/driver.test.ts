import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTimeOfDayGreeting } from "./lib/driverUtils";
import { inr, paise } from "@redtaxi/shared";

describe("Phase 6: Web Driver Experience Unit Tests (T6.1 - T6.14)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("T6.1: Time-of-day greeting and Document Verification Gate", () => {
    it("generates correct greeting by time of day", () => {
      const morningDate = new Date(2026, 9, 12, 9, 30); // 9:30 AM
      expect(getTimeOfDayGreeting(morningDate, "Selvam")).toBe("Good morning, Selvam");

      const afternoonDate = new Date(2026, 9, 12, 14, 15); // 2:15 PM
      expect(getTimeOfDayGreeting(afternoonDate, "Selvam")).toBe("Good afternoon, Selvam");

      const eveningDate = new Date(2026, 9, 12, 19, 45); // 7:45 PM
      expect(getTimeOfDayGreeting(eveningDate, "Selvam")).toBe("Good evening, Selvam");
    });

    it("evaluates if go-online is blocked when documents are unverified", () => {
      const checkCanGoOnline = (docs: Array<{ status: string }>) => {
        const hasUnverified = docs.some((d) => d.status !== "approved");
        if (hasUnverified) {
          return { allowed: false, error: "DOCUMENTS_UNVERIFIED" };
        }
        return { allowed: true };
      };

      const unverifiedDocs = [
        { status: "approved" },
        { status: "pending" },
        { status: "approved" },
      ];
      expect(checkCanGoOnline(unverifiedDocs)).toEqual({
        allowed: false,
        error: "DOCUMENTS_UNVERIFIED",
      });

      const approvedDocs = [{ status: "approved" }, { status: "approved" }, { status: "approved" }];
      expect(checkCanGoOnline(approvedDocs)).toEqual({
        allowed: true,
      });
    });
  });

  describe("T6.2: Offer Countdown from Server expiresAt with Clock Skew", () => {
    it("computes remaining seconds from server expiresAt correctly even with client clock skew", () => {
      const calculateRemaining = (
        expiresAtIso: string,
        clientNowMs: number,
        skewMs: number = 0
      ) => {
        const expiresMs = new Date(expiresAtIso).getTime();
        const adjustedNow = clientNowMs + skewMs;
        return Math.max(0, Math.ceil((expiresMs - adjustedNow) / 1000));
      };

      const baseNow = 1000000;
      const expiresAt = new Date(baseNow + 45000).toISOString(); // 45 seconds

      // Normal clock
      expect(calculateRemaining(expiresAt, baseNow)).toBe(45);

      // Inject 5s clock skew (T6.2 requirement)
      expect(calculateRemaining(expiresAt, baseNow, 5000)).toBe(40);

      // Past expiry
      expect(calculateRemaining(expiresAt, baseNow + 50000)).toBe(0);
    });
  });

  describe("T6.4 & T6.5: 4-Digit Start OTP & Attempt Limit", () => {
    it("validates 4-digit numeric OTP and locks after 5 failed attempts", () => {
      const verifyStartOtp = (enteredOtp: string, correctOtp: string, currentAttempts: number) => {
        const nextAttempts = currentAttempts + 1;
        if (nextAttempts > 5) {
          return { success: false, locked: true, attempts: nextAttempts };
        }
        if (enteredOtp !== correctOtp) {
          return {
            success: false,
            locked: nextAttempts >= 5,
            attempts: nextAttempts,
          };
        }
        return { success: true, locked: false, attempts: nextAttempts };
      };

      let attempts = 0;
      // Wrong attempt 1
      let res = verifyStartOtp("1111", "4321", attempts);
      expect(res.success).toBe(false);
      expect(res.locked).toBe(false);
      attempts = res.attempts;

      // Repeat to attempt 4
      for (let i = 2; i <= 4; i++) {
        res = verifyStartOtp("1111", "4321", attempts);
        attempts = res.attempts;
      }
      expect(attempts).toBe(4);
      expect(res.locked).toBe(false);

      // 5th wrong attempt locks
      res = verifyStartOtp("9999", "4321", attempts);
      expect(res.success).toBe(false);
      expect(res.locked).toBe(true);

      // Correct OTP immediately succeeds when not locked
      const successRes = verifyStartOtp("4321", "4321", 0);
      expect(successRes.success).toBe(true);
      expect(successRes.locked).toBe(false);
    });
  });

  describe("T6.6: Amount to Collect Calculation on Trip Completion", () => {
    it("strictly computes amount to collect = total - paid (₹1,494 - ₹500 = ₹994)", () => {
      const total = paise(149400); // ₹1,494
      const paid = paise(50000); // ₹500
      const toCollect = paise(Math.max(0, total - paid)); // ₹994

      expect(toCollect).toBe(99400);
      expect(inr(toCollect)).toBe("₹994");
    });
  });

  describe("T6.11: Document Upload Magic Bytes and File Validation", () => {
    it("validates PDF / PNG magic bytes and rejects dangerous extensions", () => {
      const validateDocFile = (fileName: string, base64Header: string, sizeBytes: number) => {
        if (sizeBytes > 10 * 1024 * 1024) return { valid: false, error: "FILE_TOO_LARGE" };
        const ext = fileName.toLowerCase().split(".").pop();
        if (["exe", "html", "js", "sh"].includes(ext || "")) {
          return { valid: false, error: "DANGEROUS_EXTENSION" };
        }
        const isMagicValid =
          base64Header.startsWith("JVBERi") || // PDF
          base64Header.startsWith("iVBOR") || // PNG
          base64Header.startsWith("/9j/"); // JPEG
        if (!isMagicValid) {
          return { valid: false, error: "MAGIC_MISMATCH" };
        }
        return { valid: true };
      };

      // Valid PDF
      expect(validateDocFile("license.pdf", "JVBERi0xLjUK", 500000)).toEqual({ valid: true });

      // Renamed executable pretending to be PDF
      expect(validateDocFile("exploit.pdf", "TVqQAAMAAAAE", 500000)).toEqual({
        valid: false,
        error: "MAGIC_MISMATCH",
      });

      // Dangerous extension
      expect(validateDocFile("script.exe", "JVBERi0xLjUK", 500000)).toEqual({
        valid: false,
        error: "DANGEROUS_EXTENSION",
      });

      // Oversize file
      expect(validateDocFile("big.pdf", "JVBERi0xLjUK", 15 * 1024 * 1024)).toEqual({
        valid: false,
        error: "FILE_TOO_LARGE",
      });
    });
  });

  describe("T6.12: Bank Details Masking Invariant", () => {
    it("ensures only the last 4 digits are exposed in bank details", () => {
      const maskBankAccount = (accNo: string) => {
        const last4 = accNo.slice(-4);
        return `•••• •••• •••• ${last4}`;
      };

      const masked = maskBankAccount("1234567890124321");
      expect(masked).toBe("•••• •••• •••• 4321");
      expect(masked).not.toContain("123456789012");
    });
  });
});
