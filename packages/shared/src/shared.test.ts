import { describe, it, expect } from "vitest";
import {
  computeFare,
  calculateDepositOptions,
  canMove,
  transitions,
  getPassengerScreen,
  getDriverScreen,
  inr,
  km,
  dur,
  formatIST,
  paise,
  PhoneSchema,
  LoginOtpSchema,
  RideStartOtpSchema,
  type BookingStatus,
  colors,
  parseHexColor,
  contrastRatio,
  minTouchTarget,
} from "./index";

describe("packages/shared unit test suite", () => {
  describe("T1.1: computeFare storyboard sample", () => {
    it("computes exact numbers for 65.2 km Sedan @ ₹16/km with batta 300 and toll 80", () => {
      const result = computeFare({
        distanceKm: 65.2,
        ratePerKm: paise(1600), // ₹16.00 = 1600 paise
        batta: paise(30000), // ₹300.00 = 30000 paise
        tollEstimate: paise(8000), // ₹80.00 = 8000 paise
      });

      // Expected exact amounts in paise (100 paise = ₹1)
      expect(result.distance).toBe(104300); // ₹1,043.00
      expect(result.batta).toBe(30000); // ₹300.00
      expect(result.toll).toBe(8000); // ₹80.00
      expect(result.gst).toBe(7100); // ₹71.00 (5% of 142300 = 7115 -> 7100)
      expect(result.total).toBe(149400); // ₹1,494.00
      expect(result.lines).toHaveLength(4);
    });
  });

  describe("T1.2: Fare edge cases & validation", () => {
    it("minKm raises billable distance when actual distance is lower", () => {
      const result = computeFare({
        distanceKm: 50,
        minKm: 100, // min 100 km applies
        ratePerKm: paise(1600),
        batta: paise(30000),
        tollEstimate: paise(8000),
      });

      // 100 km * 1600 paise = 160000 paise (₹1,600)
      expect(result.distance).toBe(160000);
    });

    it("includes night allowance when provided before GST calculation", () => {
      const result = computeFare({
        distanceKm: 10,
        ratePerKm: paise(1600), // 16000 paise
        batta: paise(0),
        tollEstimate: paise(0),
        nightAllowance: paise(20000), // ₹200 night
        gstRate: 0.05,
      });

      expect(result.night).toBe(20000);
      // subtotal = 16000 + 20000 = 36000. 5% GST = 1800
      expect(result.gst).toBe(1800);
      expect(result.total).toBe(37800);
      expect(result.lines.find((l) => l.key === "night")).toBeDefined();
    });

    it("handles 0 km distance gracefully", () => {
      const result = computeFare({
        distanceKm: 0,
        ratePerKm: paise(1600),
        batta: paise(10000),
        tollEstimate: paise(0),
      });

      expect(result.distance).toBe(0);
      expect(result.total).toBe(10500); // 10000 batta + 500 gst
    });

    it("rejects negative inputs with RangeError", () => {
      expect(() =>
        computeFare({
          distanceKm: -1,
          ratePerKm: paise(1600),
          batta: paise(0),
          tollEstimate: paise(0),
        })
      ).toThrow(RangeError);
      expect(() =>
        computeFare({
          distanceKm: 10,
          ratePerKm: paise(-100),
          batta: paise(0),
          tollEstimate: paise(0),
        })
      ).toThrow(RangeError);
      expect(() =>
        computeFare({
          distanceKm: 10,
          ratePerKm: paise(1600),
          batta: paise(-1),
          tollEstimate: paise(0),
        })
      ).toThrow(RangeError);
      expect(() =>
        computeFare({
          distanceKm: 10,
          ratePerKm: paise(1600),
          batta: paise(0),
          tollEstimate: paise(-1),
        })
      ).toThrow(RangeError);
      expect(() =>
        computeFare({
          distanceKm: 10,
          ratePerKm: paise(1600),
          batta: paise(0),
          tollEstimate: paise(0),
          nightAllowance: paise(-10),
        })
      ).toThrow(RangeError);
    });

    it("asserts finite number in paise() helper", () => {
      expect(paise(1234.6)).toBe(1235);
      expect(() => paise(NaN)).toThrow(TypeError);
    });
  });

  describe("T1.3 & T1.4: Advance Deposit and Property Invariant", () => {
    it("T1.3: calculates sample deposit (₹1,494 -> payNow ₹500, payAtDrop ₹994)", () => {
      const options = calculateDepositOptions(paise(149400), {
        advanceDepositPercent: 25,
        minDeposit: paise(50000), // ₹500
      });

      const depositOpt = options.find((o) => o.type === "deposit");
      const fullOpt = options.find((o) => o.type === "full");

      expect(depositOpt).toBeDefined();
      expect(depositOpt!.payNow).toBe(50000); // ₹500.00
      expect(depositOpt!.payAtDrop).toBe(99400); // ₹994.00
      expect(depositOpt!.payNow + depositOpt!.payAtDrop).toBe(149400);

      expect(fullOpt).toBeDefined();
      expect(fullOpt!.payNow).toBe(149400);
      expect(fullOpt!.payAtDrop).toBe(0);
    });

    it("T1.3: uses custom percent and minDeposit correctly", () => {
      const options = calculateDepositOptions(paise(100000), {
        advanceDepositPercent: 30,
        minDeposit: paise(20000),
      });
      const depositOpt = options.find((o) => o.type === "deposit");
      expect(depositOpt!.payNow).toBe(30000); // 30% of 100000 = 30000 > 20000
      expect(depositOpt!.payAtDrop).toBe(70000);

      // And test with no config passed at all (default branches)
      const defaultOptions = calculateDepositOptions(paise(100000));
      expect(defaultOptions[0]!.payNow).toBe(50000); // default min 50000 applies
    });

    it("rejects negative total in calculateDepositOptions", () => {
      expect(() => calculateDepositOptions(paise(-500))).toThrow(RangeError);
    });

    it("T1.4 Property Test: 10,000 random quotes invariant payNow + payAtDrop === total and are integers", () => {
      for (let i = 0; i < 10000; i++) {
        // Random total between 0 and 1,000,000 paise (up to ₹10,000)
        const randomTotal = paise(Math.floor(Math.random() * 1000000));
        const randomPercent = Math.floor(Math.random() * 50) + 10;
        const randomMin = paise(Math.floor(Math.random() * 60000));

        const options = calculateDepositOptions(randomTotal, {
          advanceDepositPercent: randomPercent,
          minDeposit: randomMin,
        });

        for (const opt of options) {
          expect(Number.isInteger(opt.payNow)).toBe(true);
          expect(Number.isInteger(opt.payAtDrop)).toBe(true);
          expect(opt.payNow + opt.payAtDrop).toBe(randomTotal);
          expect(opt.payNow).toBeGreaterThanOrEqual(0);
          expect(opt.payAtDrop).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("T1.5 & T1.6: Formatters", () => {
    it("T1.5: formats inr with Indian grouping", () => {
      expect(inr(149400)).toBe("₹1,494");
      expect(inr(24850000)).toBe("₹2,48,500");
      expect(inr(149400, 2)).toBe("₹1,494.00");
    });

    it("T1.6: formats km and duration correctly", () => {
      expect(km(65.2)).toBe("65.2 km");
      expect(dur(85)).toBe("1 hr 25 min");
      expect(dur(45)).toBe("45 min");
      expect(dur(120)).toBe("2 hr");
    });

    it("formats IST dates without throwing", () => {
      const now = new Date("2026-10-10T14:30:00Z");
      const formatted = formatIST(now);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe("string");
      expect(formatIST("2026-10-10T14:30:00Z", "long")).toBeDefined();
    });
  });

  describe("T1.7 & T1.8: State Machine & Unified Status Enum", () => {
    const allStatuses: BookingStatus[] = [
      "created",
      "scheduled",
      "searching",
      "driver_assigned",
      "driver_arriving",
      "driver_arrived",
      "in_progress",
      "completed",
      "cancelled",
      "no_driver",
    ];

    it("T1.7: validates all allowed edges and rejects invalid edges in the transition matrix", () => {
      for (const from of allStatuses) {
        const allowedTargets = transitions[from];
        for (const to of allStatuses) {
          if (allowedTargets.includes(to)) {
            expect(canMove(from, to)).toBe(true);
          } else {
            expect(canMove(from, to)).toBe(false);
          }
        }
      }
    });

    it("T1.7: verified that terminal states completed and cancelled have 0 exits", () => {
      expect(transitions.completed).toHaveLength(0);
      expect(transitions.cancelled).toHaveLength(0);
    });

    it("T1.8: screen mappings return valid screen strings for all statuses", () => {
      for (const status of allStatuses) {
        expect(getPassengerScreen(status)).toBeDefined();
        expect(getDriverScreen(status)).toBeDefined();
      }
    });
  });

  describe("T1.9: Zod Validation Schemas", () => {
    it("PhoneSchema accepts valid 10-digit Indian phones starting 6-9", () => {
      expect(PhoneSchema.safeParse("9876543210").success).toBe(true);
      expect(PhoneSchema.safeParse("8765432109").success).toBe(true);
      expect(PhoneSchema.safeParse("7654321098").success).toBe(true);
      expect(PhoneSchema.safeParse("6543210987").success).toBe(true);
    });

    it("PhoneSchema rejects invalid numbers", () => {
      expect(PhoneSchema.safeParse("5876543210").success).toBe(false); // starts with 5
      expect(PhoneSchema.safeParse("98765").success).toBe(false); // too short
      expect(PhoneSchema.safeParse("98765432101").success).toBe(false); // too long
      expect(PhoneSchema.safeParse("987654321a").success).toBe(false); // non-digits
    });

    it("LoginOtpSchema strictly requires 6 numeric digits", () => {
      expect(LoginOtpSchema.safeParse("123456").success).toBe(true);
      expect(LoginOtpSchema.safeParse("12345").success).toBe(false);
      expect(LoginOtpSchema.safeParse("1234567").success).toBe(false);
      expect(LoginOtpSchema.safeParse("12345a").success).toBe(false);
    });

    it("RideStartOtpSchema strictly requires 4 numeric digits", () => {
      expect(RideStartOtpSchema.safeParse("4321").success).toBe(true);
      expect(RideStartOtpSchema.safeParse("432").success).toBe(false);
      expect(RideStartOtpSchema.safeParse("43210").success).toBe(false);
      expect(RideStartOtpSchema.safeParse("432a").success).toBe(false);
    });
  });

  describe("T2.1 & T2.5: Design System Tokens & WCAG Contrast Rules", () => {
    it("exports all defined brand, neutral, and semantic colors", () => {
      expect(colors.accent).toBe("#6969EF");
      expect(colors.accentLight).toBe("#7D7DFF");
      expect(colors.surface).toBe("#D3D3FF");
      expect(colors.bgDark).toBe("#C6C6FF");
      expect(colors.background).toBe("#F5F6F4");
      expect(colors.white).toBe("#FFFFFF");
      expect(colors.ink).toBe("#000344");
      expect(colors.body).toBe("#424242");
      expect(colors.muted).toBe("#A6A7BE");
      expect(colors.success).toBe("#50FF97");
      expect(colors.danger).toBe("#E5484D");
      expect(colors.warning).toBe("#F5A524");
      expect(colors.star).toBe("#FFB400");
      expect(minTouchTarget).toBe(44);
    });

    it("parses hex colors correctly into RGB", () => {
      const rgb = parseHexColor("#6969EF");
      expect(rgb).toEqual({ r: 0x69, g: 0x69, b: 0xef });
      const white = parseHexColor("#FFFFFF");
      expect(white).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("T2.5: Body text on background satisfies WCAG AA >= 4.5:1", () => {
      const ratio = contrastRatio(colors.body, colors.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("T2.5: Ink (headings) on background satisfies WCAG AAA >= 7.0:1", () => {
      const ratio = contrastRatio(colors.ink, colors.background);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
    });

    it("T2.5: Ink on surface satisfies WCAG AA >= 4.5:1", () => {
      const ratio = contrastRatio(colors.ink, colors.surface);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it("T2.5: White on accent is acceptable for large/bold text only (>= 3:1, < 4.5:1)", () => {
      const ratio = contrastRatio(colors.white, colors.accent);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(ratio).toBeLessThan(4.5);
    });

    it("T2.5: Muted text on background is < 4.5:1 (enforcing rule: never muted for essential text)", () => {
      const ratio = contrastRatio(colors.muted, colors.background);
      expect(ratio).toBeLessThan(4.5);
    });
  });
});
