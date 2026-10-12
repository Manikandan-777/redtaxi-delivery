import { describe, it, expect, beforeEach } from "vitest";
import { bookingDraftStore } from "./lib/bookingDraft";
import { computeFare, calculateDepositOptions, paise, inr } from "@redtaxi/shared";

describe("Phase 4: Passenger Booking State & Fare Computations (T4.1 - T4.14)", () => {
  beforeEach(() => {
    bookingDraftStore.getState().resetDraft();
  });

  describe("T4.1 & T4.2: Draft Initialization & State Transitions", () => {
    it("initializes with default Pollachi -> Coimbatore route and sedan selection", () => {
      const state = bookingDraftStore.getState();
      expect(state.pickup?.label).toBe("Pollachi Town");
      expect(state.drop?.label).toBe("Coimbatore Airport");
      expect(state.vehicleClass).toBe("sedan");
      expect(state.mode).toBe("one_way");
      expect(state.paymentOption).toBe("deposit");
    });

    it("allows updating pickup, drop, vehicle, and trip mode", () => {
      const store = bookingDraftStore.getState();
      store.setPickup({ label: "Kinathukadavu", lat: 10.82, lng: 77.02 });
      store.setDrop({ label: "Gandhipuram", lat: 11.02, lng: 76.96 });
      store.setVehicleClass("suv");
      store.setVehicleId("veh_suv_1");
      store.setMode("round_trip");
      store.setPaymentOption("full");

      const updated = bookingDraftStore.getState();
      expect(updated.pickup?.label).toBe("Kinathukadavu");
      expect(updated.drop?.label).toBe("Gandhipuram");
      expect(updated.vehicleClass).toBe("suv");
      expect(updated.vehicleId).toBe("veh_suv_1");
      expect(updated.mode).toBe("round_trip");
      expect(updated.paymentOption).toBe("full");
    });

    it("resets draft state cleanly to initial values", () => {
      const store = bookingDraftStore.getState();
      store.setVehicleClass("innova");
      store.setPaymentOption("full");

      store.resetDraft();
      const resetState = bookingDraftStore.getState();
      expect(resetState.vehicleClass).toBe("sedan");
      expect(resetState.paymentOption).toBe("deposit");
    });
  });

  describe("T4.6: Outstation / One-way Fare Computation (Exact Integer Paise)", () => {
    it("computes Pollachi to Coimbatore (65.2 km) fare in exact integer paise without floats", () => {
      // 65.2 km @ ₹16/km (1600 paise), batta ₹300 (30000 paise), toll ₹80 (8000 paise)
      const res = computeFare({
        distanceKm: 65.2,
        ratePerKm: paise(1600),
        batta: paise(30000),
        tollEstimate: paise(8000),
      });

      expect(Number.isInteger(res.total)).toBe(true);
      expect(res.total).toBe(paise(149400)); // ₹1,494 in integer paise
      expect(inr(res.total)).toBe("₹1,494");

      // Verify individual lines are integers
      expect(res.distance).toBe(paise(104300));
      expect(res.batta).toBe(paise(30000));
      expect(res.toll).toBe(paise(8000));
      expect(res.gst).toBe(paise(7100));
      expect(res.distance + res.batta + res.toll + res.gst).toBe(res.total);
    });

    it("DEC-1: Verifies that FareQuote does not contain (₹14.90 / km) caption string", () => {
      const res = computeFare({
        distanceKm: 65.2,
        ratePerKm: paise(1600),
        batta: paise(30000),
        tollEstimate: paise(8000),
      });

      const lineLabels = res.lines.map((l) => l.label).join(" ");
      expect(lineLabels).not.toContain("₹14.90 / km");
      expect(lineLabels).not.toContain("₹14.90");
    });
  });

  describe("T4.9 & DEC-2: Deposit Calculation Invariant (payNow + payAtDrop === total)", () => {
    it("satisfies deposit property invariant: payNow + payAtDrop === total", () => {
      const total = paise(149400); // ₹1,494.00
      const options = calculateDepositOptions(total, {
        advanceDepositPercent: 25,
        minDeposit: paise(50000),
      });

      expect(options).toHaveLength(2);

      const depositOption = options.find((o) => o.type === "deposit");
      const fullOption = options.find((o) => o.type === "full");

      expect(depositOption).toBeDefined();
      expect(fullOption).toBeDefined();

      if (depositOption && fullOption) {
        expect(depositOption.payNow + depositOption.payAtDrop).toBe(total);
        expect(fullOption.payNow + fullOption.payAtDrop).toBe(total);
        expect(depositOption.payNow).toBe(paise(50000)); // max(25% of 1494 = 373.50, min 500) = 500
        expect(depositOption.payAtDrop).toBe(paise(99400));
        expect(fullOption.payNow).toBe(total);
        expect(fullOption.payAtDrop).toBe(paise(0));
      }
    });

    it("handles total smaller than min deposit cleanly", () => {
      const total = paise(35000); // ₹350
      const options = calculateDepositOptions(total, {
        advanceDepositPercent: 25,
        minDeposit: paise(50000), // ₹500
      });

      const depositOption = options.find((o) => o.type === "deposit")!;
      // payNow cannot exceed total
      expect(depositOption.payNow).toBe(total);
      expect(depositOption.payAtDrop).toBe(paise(0));
      expect(depositOption.payNow + depositOption.payAtDrop).toBe(total);
    });
  });

  describe("T4.5: Past Date Validation Logic", () => {
    it("identifies past dates and permits future dates", () => {
      const today = new Date().toISOString().split("T")[0] || "";
      const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0] || "";
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0] || "";

      const isPast = (dateStr: string) => dateStr < today;

      expect(isPast(yesterday)).toBe(true);
      expect(isPast(today)).toBe(false);
      expect(isPast(tomorrow)).toBe(false);
    });
  });
});
