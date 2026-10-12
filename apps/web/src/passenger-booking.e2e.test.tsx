// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BookPaymentPage from "./app/book/payment/page";
import BookFarePage from "./app/book/fare/page";
import BookRoutePage from "./app/book/route/page";
import BookVehiclePage from "./app/book/vehicle/page";
import { bookingDraftStore } from "./lib/bookingDraft";
import { paise } from "@redtaxi/shared";

import { cleanup } from "@testing-library/react";

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe("T4.11 - T4.14 & DEC-10: Passenger Booking Flow E2E (Web)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    bookingDraftStore.getState().resetDraft();
  });

  describe("WP2: Vehicle Selection (/book/vehicle)", () => {
    it("renders vehicle list with popular tags and handles vehicle selection", () => {
      render(<BookVehiclePage />);

      // Fleet cards present
      expect(screen.getAllByText(/Swift Dzire/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Maruti Ertiga/i)).toBeInTheDocument();

      // Popular tag check
      expect(screen.getByText(/^Popular$/i)).toBeInTheDocument();

      // Unavailable vehicle has disabled button and warning label
      expect(screen.getByText(/Currently Unavailable in this zone/i)).toBeInTheDocument();
      const allSelectBtns = screen.getAllByRole("button", { name: /Select/i });
      const hasDisabled = allSelectBtns.some((b) => b.hasAttribute("disabled"));
      expect(hasDisabled).toBe(true);

      // Select vehicle action
      expect(allSelectBtns.length).toBeGreaterThan(0);
      const firstBtn = allSelectBtns[0];
      if (firstBtn) {
        fireEvent.click(firstBtn);
      }
    });
  });

  describe("WP3: Route Specification (/book/route)", () => {
    it("allows switching trip mode, swapping locations, and detects past dates", () => {
      render(<BookRoutePage />);

      // Mode switches
      const roundTripBtn = screen.getByRole("radio", { name: /Round Trip/i });
      fireEvent.click(roundTripBtn);
      expect(bookingDraftStore.getState().mode).toBe("round_trip");

      // Swap locations
      const swapBtn = screen.getByRole("button", { name: /Swap pickup and drop/i });
      fireEvent.click(swapBtn);

      // Past date check
      const dateInput = screen.getByLabelText(/Pickup Date/i);
      fireEvent.change(dateInput, { target: { value: "2020-01-01" } });
      expect(screen.getByText(/Past date blocked/i)).toBeInTheDocument();
    });
  });

  describe("WP4: Fare Review (/book/fare)", () => {
    it("displays countdown timer, deposit vs full toggle, and conforms to DEC-1 (no per-km caption)", () => {
      render(<BookFarePage />);

      // 15-minute countdown visible
      expect(screen.getByText(/Quote Guaranteed For/i)).toBeInTheDocument();

      // DEC-1: Fare Quote screen must NOT show "(₹14.90 / km)" caption
      const content = document.body.textContent || "";
      expect(content).not.toContain("₹14.90 / km");
      expect(content).not.toContain("(₹14.90 / km)");

      // Toggle full payment
      const fullRadio = screen.getByRole("radio", { name: /100% Full Payment/i });
      fireEvent.click(fullRadio);
      expect(bookingDraftStore.getState().paymentOption).toBe("full");
    });
  });

  describe("WP5: Payment & DEC-10 Razorpay Verification (/book/payment)", () => {
    it("DEC-10: 'Booking Confirmed' is NEVER displayed before verification passes", async () => {
      render(<BookPaymentPage />);

      // Pay button is disabled until terms checkbox is checked
      const payBtn = screen.getByRole("button", { name: /Pay ₹500/i });
      expect(payBtn).toBeDisabled();

      // Check terms checkbox
      const termsCheckbox = screen.getByLabelText(/Terms and Conditions/i);
      fireEvent.click(termsCheckbox);
      expect(payBtn).not.toBeDisabled();

      // Crucial: "Booking Confirmed" is NOT present before payment
      expect(screen.queryByText(/Booking Confirmed!/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Start OTP:/i)).not.toBeInTheDocument();
    });

    it("creates payment order and verifies signature before showing Booking Confirmed", async () => {
      const mockOrder = {
        orderId: "order_mock_test_123",
        amountPaise: 50000,
        currency: "INR",
        keyId: "rzp_test_mock_123",
      };

      const mockBooking = {
        id: "bk_mock_confirmed_999",
        code: "BK10234",
        status: "created",
        startOtp: "4829",
        paid: paise(50000),
        due: paise(99400),
        pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
        drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
        startsAt: new Date().toISOString(),
        customer: { id: "c1", name: "Anand" },
        timeline: [{ status: "created", at: new Date().toISOString() }],
      };

      globalFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOrder,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            verified: true,
            booking: mockBooking,
          }),
        });

      render(<BookPaymentPage />);

      const termsCheckbox = screen.getByLabelText(/Terms and Conditions/i);
      fireEvent.click(termsCheckbox);

      const payBtn = screen.getByRole("button", { name: /Pay ₹500/i });
      fireEvent.click(payBtn);

      // Verify that fetch was called for order creation and verification
      await waitFor(() => {
        expect(globalFetch).toHaveBeenCalledTimes(2);
      });

      // Confirmed screen appears with OTP after verification
      await waitFor(() => {
        expect(screen.getByText(/Booking Confirmed!/i)).toBeInTheDocument();
        expect(screen.getByText("4829")).toBeInTheDocument();
        expect(screen.getByText("BK10234")).toBeInTheDocument();
      });
    });

    it("displays error message if signature verification fails", async () => {
      globalFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ orderId: "order_mock_123" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: "Invalid signature" }),
        });

      render(<BookPaymentPage />);

      const termsCheckbox = screen.getByLabelText(/Terms and Conditions/i);
      fireEvent.click(termsCheckbox);

      const payBtn = screen.getByRole("button", { name: /Pay ₹500/i });
      fireEvent.click(payBtn);

      await waitFor(() => {
        expect(screen.getByText(/Payment signature verification failed/i)).toBeInTheDocument();
      });

      // DEC-10: Booking Confirmed MUST NOT be shown
      expect(screen.queryByText(/Booking Confirmed!/i)).not.toBeInTheDocument();
    });
  });
});
