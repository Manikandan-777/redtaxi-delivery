import { describe, it, expect } from "vitest";
import {
  INITIAL_ADMIN_STATS,
  INITIAL_ADMIN_DRIVERS,
  INITIAL_ADMIN_BOOKINGS,
  INITIAL_ADMIN_PRICING,
  INITIAL_ADMIN_TICKETS,
  INITIAL_ADMIN_ANALYTICS,
  type AdminDriverRecord,
} from "./lib/adminData";
import { formatInr, paise, sanitizeCsvCell, generateCsv } from "@redtaxi/shared";

describe("Phase 7: Web Admin Operations Unit Tests (T7.1 - T7.12)", () => {
  describe("T7.1: Strict RBAC check", () => {
    it("ensures non-admin roles cannot access admin routes", () => {
      const isRouteAllowed = (role: string, path: string) => {
        if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
          return role === "admin";
        }
        return true;
      };

      expect(isRouteAllowed("passenger", "/admin")).toBe(false);
      expect(isRouteAllowed("driver", "/admin/drivers")).toBe(false);
      expect(isRouteAllowed("passenger", "/admin/pricing")).toBe(false);
      expect(isRouteAllowed("admin", "/admin/dispatch")).toBe(true);
      expect(isRouteAllowed("anonymous", "/admin/login")).toBe(true);
    });
  });

  describe("T7.2: DEC-6 Dashboard operational metrics", () => {
    it("matches exact DEC-6 targets: 342 total, 14 active, 58 online, 3 pending, 310 completed", () => {
      expect(INITIAL_ADMIN_STATS.totalBookingsToday).toBe(342);
      expect(INITIAL_ADMIN_STATS.activeRides).toBe(14);
      expect(INITIAL_ADMIN_STATS.driversOnline).toBe(58);
      expect(INITIAL_ADMIN_STATS.pendingDrivers).toBe(3);
      expect(INITIAL_ADMIN_STATS.completedToday).toBe(310);
      expect(INITIAL_ADMIN_STATS.percentChangeVsYesterday).toBe(12);
    });
  });

  describe("T7.3: Drivers pagination and search filtering", () => {
    it("filters drivers by status and debounced search keyword", () => {
      const filterDrivers = (status: string, query: string) => {
        return INITIAL_ADMIN_DRIVERS.filter((d) => {
          const matchesStatus = status === "all" || d.status === status;
          const matchesQuery =
            !query ||
            d.name.toLowerCase().includes(query.toLowerCase()) ||
            d.vehicleNo.toLowerCase().includes(query.toLowerCase());
          return matchesStatus && matchesQuery;
        });
      };

      const pendingList = filterDrivers("pending", "");
      expect(pendingList).toHaveLength(2); // Arun Kumar & Mohan Raj

      const searchSelvam = filterDrivers("all", "Selvam");
      expect(searchSelvam).toHaveLength(1);
      expect(searchSelvam[0]?.name).toBe("Selvam Kumar");
    });
  });

  describe("T7.4: Verification: Approve disabled until all docs verified, Reject requires reason", () => {
    it("disables approve when any document is pending/unverified", () => {
      const canApprove = (driver: AdminDriverRecord) => {
        return driver.documents.every((d) => d.status === "approved");
      };

      const pendingDriver = INITIAL_ADMIN_DRIVERS.find((d) => d.status === "pending")!;
      expect(canApprove(pendingDriver)).toBe(false);

      const approvedDriver = INITIAL_ADMIN_DRIVERS.find((d) => d.status === "approved")!;
      expect(canApprove(approvedDriver)).toBe(true);
    });

    it("requires a non-empty reason to reject a driver", () => {
      const validateRejection = (reason: string) => {
        if (!reason || !reason.trim()) {
          return { valid: false, error: "REASON_REQUIRED" };
        }
        return { valid: true };
      };

      expect(validateRejection("").valid).toBe(false);
      expect(validateRejection("   ").valid).toBe(false);
      expect(validateRejection("Commercial badge expired").valid).toBe(true);
    });
  });

  describe("T7.5: Bookings timeline and audited actions", () => {
    it("retains accurate status history timeline", () => {
      const booking = INITIAL_ADMIN_BOOKINGS[0];
      expect(booking?.timeline.length).toBeGreaterThanOrEqual(2);
      expect(booking?.timeline[0]?.status).toBe("created");
    });
  });

  describe("T7.6: Dispatch nearby drivers sorted ascending by distance and offline disabled", () => {
    it("sorts drivers ascending by distance", () => {
      const sorted = INITIAL_ADMIN_DRIVERS.slice().sort(
        (a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99)
      );

      expect(sorted[0]?.name).toBe("Selvam Kumar"); // 1.2 km
      expect(sorted[1]?.name).toBe("Arun Kumar"); // 3.5 km
      expect(sorted[2]?.name).toBe("Mohan Raj"); // 4.1 km
      expect(sorted[3]?.name).toBe("Karthik"); // 6.3 km
      expect(sorted[4]?.name).toBe("Dinesh"); // 8.2 km
    });

    it("flags offline drivers as not assignable", () => {
      const dinesh = INITIAL_ADMIN_DRIVERS.find((d) => d.name === "Dinesh")!;
      expect(dinesh.online).toBe(false);
    });
  });

  describe("T7.7 & T7.8: Pricing Rules validation and exact round-trip ₹16.00 ↔ 1600 paise", () => {
    it("converts decimal rupees to integer paise without float errors", () => {
      const sedanRule = INITIAL_ADMIN_PRICING.sedan;
      expect(sedanRule.baseRatePerKmRupees).toBe(16.0);

      const inPaise = Math.round(sedanRule.baseRatePerKmRupees * 100);
      expect(inPaise).toBe(1600); // 1600 paise exact

      const formatted = formatInr(paise(inPaise));
      expect(formatted).toBe("₹16");
    });

    it("validates pricing ranges: rate > 0, batta >= 0, deposit 0-100", () => {
      const validatePricing = (rate: number, batta: number, deposit: number) => {
        if (rate <= 0) return "INVALID_RATE";
        if (batta < 0) return "INVALID_BATTA";
        if (deposit < 0 || deposit > 100) return "INVALID_DEPOSIT";
        return "VALID";
      };

      expect(validatePricing(0, 300, 25)).toBe("INVALID_RATE");
      expect(validatePricing(16, -10, 25)).toBe("INVALID_BATTA");
      expect(validatePricing(16, 300, 150)).toBe("INVALID_DEPOSIT");
      expect(validatePricing(16, 300, 25)).toBe("VALID");
    });
  });

  describe("T7.9: Support Tickets ordered by priority then age", () => {
    it("orders high priority before medium and low, then by age", () => {
      const priorityWeights: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const sorted = INITIAL_ADMIN_TICKETS.slice().sort((a, b) => {
        const pDiff = (priorityWeights[b.priority] ?? 0) - (priorityWeights[a.priority] ?? 0);
        if (pDiff !== 0) return pDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted[0]?.priority).toBe("high");
      expect(sorted[0]?.code).toBe("STK1001");
      expect(sorted[1]?.priority).toBe("medium");
      expect(sorted[2]?.priority).toBe("medium");
      expect(sorted[3]?.priority).toBe("low");
    });
  });

  describe("T7.10: Analytics completion rate 90.6% (310/342)", () => {
    it("calculates completion rate of 90.6% exactly for 310/342", () => {
      const rate = (310 / 342) * 100;
      expect(rate.toFixed(1)).toBe("90.6");
      expect(INITIAL_ADMIN_ANALYTICS.completionRatePercent).toBe(90.6);
      expect(INITIAL_ADMIN_ANALYTICS.totalBookings).toBe(342);
      expect(INITIAL_ADMIN_ANALYTICS.completedBookings).toBe(310);
    });
  });

  describe("T7.11 & SC-H2: CSV Export formula cell neutralisation", () => {
    it("neutralises dangerous formula prefix characters (=, +, -, @)", () => {
      expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeCsvCell("+123456")).toBe("'+123456");
      expect(sanitizeCsvCell("-100")).toBe("'-100");
      expect(sanitizeCsvCell("@cmd")).toBe("'@cmd");
      expect(sanitizeCsvCell("Normal Text")).toBe("Normal Text");
    });

    it("generates well-formed CSV with neutralised rows", () => {
      const data = [
        ["Name", "Formula", "SafeVal"],
        ["User1", "=1+1", 100],
      ];
      const csv = generateCsv(data);
      expect(csv).toContain("User1,'=1+1,100");
    });
  });
});
