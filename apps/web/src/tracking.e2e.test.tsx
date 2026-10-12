// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import BookingTrackingPage from "./app/bookings/[id]/page";
import BookingCompletePage from "./app/bookings/[id]/complete/page";
import PublicTrackingPage from "./app/t/[token]/page";
import { paise } from "@redtaxi/shared";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

const mockBooking = {
  id: "bk_track_123",
  code: "BK10234",
  status: "driver_arrived",
  customer: { id: "c1", name: "Anand", phone: "9876543210" },
  pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
  drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
  startsAt: new Date().toISOString(),
  startOtp: "4321",
  paid: paise(50000),
  due: paise(99400),
  quote: {
    id: "q_1",
    vehicleId: "v_1",
    mode: "one_way",
    distanceKm: 65,
    durationMin: 90,
    lines: [],
    total: paise(149400),
    depositOptions: [],
    validUntil: new Date(Date.now() + 900000).toISOString(),
  },
  driver: {
    id: "d_1",
    name: "Murugan S",
    phone: "9842100000",
    rating: 4.9,
    vehicleNo: "TN 38 BK 1234",
    vehicleClass: "sedan",
  },
  timeline: [{ status: "driver_arrived", at: new Date().toISOString() }],
};

describe("Phase 5: Live Tracking, SOS, Share, & Trip Completion E2E Tests (T5.1 - T5.10)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("WP6: Live Tracking Page (/bookings/[id])", () => {
    it("renders booking details, driver card, and prominent passenger Start OTP (T5.4)", async () => {
      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBooking,
      });

      render(<BookingTrackingPage params={Promise.resolve({ id: "bk_track_123" })} />);

      await waitFor(() => {
        expect(screen.getByText("BK10234")).toBeInTheDocument();
        expect(screen.getByText("Murugan S")).toBeInTheDocument();
        expect(screen.getByText(/TN 38 BK 1234/i)).toBeInTheDocument();
      });

      // T5.4: 4-digit start OTP prominent for passenger
      const otpElement = screen.getByTestId("start-otp");
      expect(otpElement).toHaveTextContent("4321");
      expect(screen.getByText(/Passenger Start OTP/i)).toBeInTheDocument();

      // Arrival banner shown since status is driver_arrived
      expect(screen.getByText(/Driver has arrived!/i)).toBeInTheDocument();
    });

    it("triggers SOS emergency alert and renders safety response banner (T5.6 & SC-E4)", async () => {
      globalFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBooking,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            alertId: "sos_1234",
            message: "Emergency response team and nearby drivers alerted.",
          }),
        });

      render(<BookingTrackingPage params={Promise.resolve({ id: "bk_track_123" })} />);

      await waitFor(() => {
        expect(screen.getByText("BK10234")).toBeInTheDocument();
      });

      const sosBtn = screen.getByRole("button", { name: /🚨 SOS Emergency/i });
      fireEvent.click(sosBtn);

      await waitFor(() => {
        expect(screen.getByText(/Emergency Alert Activated/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Emergency response team and nearby drivers alerted/i)
        ).toBeInTheDocument();
      });
    });

    it("generates privacy-safe public share trip link (T5.7 & VR-6)", async () => {
      globalFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBooking,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            token: "trk_abc123",
            shareUrl: "http://localhost:3000/t/trk_abc123",
          }),
        });

      // Mock navigator.clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(<BookingTrackingPage params={Promise.resolve({ id: "bk_track_123" })} />);

      await waitFor(() => {
        expect(screen.getByText("BK10234")).toBeInTheDocument();
      });

      const shareBtn = screen.getByRole("button", { name: /Share Trip/i });
      fireEvent.click(shareBtn);

      await waitFor(() => {
        expect(screen.getByText(/Public Live Tracking Link/i)).toBeInTheDocument();
        expect(screen.getByText("http://localhost:3000/t/trk_abc123")).toBeInTheDocument();
      });
    });

    it("requires reason to cancel ride and executes cancellation (T5.8)", async () => {
      globalFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBooking,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            booking: { ...mockBooking, status: "cancelled" },
          }),
        });

      render(<BookingTrackingPage params={Promise.resolve({ id: "bk_track_123" })} />);

      await waitFor(() => {
        expect(screen.getByText("BK10234")).toBeInTheDocument();
      });

      const cancelBtn = screen.getByRole("button", { name: /Cancel Ride/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText(/Cancel Your Ride/i)).toBeInTheDocument();

      // Attempting to confirm without selecting reason fails
      const confirmCancelBtn = screen.getByRole("button", { name: /Confirm Cancellation/i });
      fireEvent.click(confirmCancelBtn);

      expect(
        screen.getByText(/Please select or specify a cancellation reason/i)
      ).toBeInTheDocument();

      // Select reason
      const reasonRadio = screen.getByLabelText(/Driver requested cancellation/i);
      fireEvent.click(reasonRadio);

      // Confirm cancellation
      fireEvent.click(confirmCancelBtn);

      await waitFor(() => {
        expect(screen.getByText(/This ride was cancelled/i)).toBeInTheDocument();
      });
    });
  });

  describe("WP7: Completion & Rating Screen (/bookings/[id]/complete)", () => {
    it("displays 'Trip Completed', balance due, and handles 5-star rating submission (T5.10 & DEC-10)", async () => {
      globalFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockBooking,
            status: "completed",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: "Thank you for your feedback! Ride completed.",
          }),
        });

      render(<BookingCompletePage params={Promise.resolve({ id: "bk_track_123" })} />);

      await waitFor(() => {
        // DEC-10: Copy explicitly contains "completed"
        expect(screen.getByText("Trip Completed")).toBeInTheDocument();
      });

      // DEC-10: Balance due shown clearly when due > 0
      const balanceRow = screen.getByTestId("balance-due-row");
      expect(balanceRow).toBeInTheDocument();
      expect(balanceRow).toHaveTextContent("₹994");

      // Star rating interaction: clicking 5 stars enables submit
      const fiveStarRadio = screen.getByRole("radio", { name: "5 stars" });
      fireEvent.click(fiveStarRadio);
      expect(screen.getByText("Excellent!")).toBeInTheDocument();

      // Type comment
      const commentInput = screen.getByLabelText(/Comments & Feedback/i);
      fireEvent.change(commentInput, { target: { value: "Punctual and very safe driving!" } });
      expect(screen.getByText(/500 characters/i)).toBeInTheDocument();

      // Submit rating
      const submitBtn = screen.getByRole("button", { name: /Submit Rating/i });
      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Thank you for your rating!/i)).toBeInTheDocument();
      });
    });
  });

  describe("VR-6: Public Tracking Screen (/t/[token])", () => {
    it("displays driver, vehicle, route, and privacy notice without passenger data", async () => {
      const publicTrackingData = {
        status: "driver_arriving",
        pickup: { label: "Pollachi Town" },
        drop: { label: "Coimbatore Airport" },
        driver: {
          name: "Murugan S",
          vehicleNo: "TN 38 BK 1234",
          vehicleClass: "sedan",
          rating: 4.9,
        },
        etaMinutes: 12,
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => publicTrackingData,
      });

      render(<PublicTrackingPage params={Promise.resolve({ token: "trk_abc123" })} />);

      await waitFor(() => {
        expect(screen.getByText("RedTaxi Live Ride Share")).toBeInTheDocument();
        expect(screen.getByText("Murugan S")).toBeInTheDocument();
        expect(screen.getByText(/TN 38 BK 1234/i)).toBeInTheDocument();
        expect(screen.getByText("~12 mins")).toBeInTheDocument();
      });

      // VR-6 Privacy check: passenger phone or payment info is strictly absent
      const pageText = document.body.textContent || "";
      expect(pageText).not.toContain("9876543210");
      expect(pageText).not.toContain("Anand");
      expect(pageText).not.toContain("₹");
    });
  });
});
