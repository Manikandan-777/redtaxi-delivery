// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import DriverDashboardPage from "./app/driver/page";
import DriverTripLifecyclePage from "./app/driver/trips/[id]/page";
import DriverEarningsPage from "./app/driver/earnings/page";
import DriverProfileDocumentsPage from "./app/driver/profile/page";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe("Phase 6: Web Driver Experience End-to-End Tests (T6.1 - T6.15)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    globalFetch.mockReset();
    globalFetch.mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("/online")) {
        return { ok: true, json: async () => ({ online: true }) };
      }
      if (typeof url === "string" && url.includes("/arrived")) {
        return { ok: true, json: async () => ({ status: "driver_arrived" }) };
      }
      if (typeof url === "string" && url.includes("/start")) {
        return { ok: true, json: async () => ({ status: "in_progress" }) };
      }
      if (typeof url === "string" && url.includes("/complete")) {
        return {
          ok: true,
          json: async () => ({
            booking: { status: "completed" },
            amountToCollect: 99400,
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  describe("WD2 & WD3: Driver Dashboard & Offer Acceptance Flow", () => {
    it("renders driver greeting, online toggle, stat tiles, and incoming offer modal with countdown", async () => {
      render(<DriverDashboardPage />);

      // Check greeting
      expect(screen.getByTestId("driver-greeting")).toBeInTheDocument();
      expect(screen.getByText(/Selvam/)).toBeInTheDocument();

      // Check online toggle
      const toggle = screen.getByTestId("online-toggle");
      expect(toggle).toBeInTheDocument();

      // Check stat tiles
      expect(screen.getByTestId("stat-earnings")).toBeInTheDocument();
      expect(screen.getByTestId("stat-trips")).toBeInTheDocument();
      expect(screen.getByTestId("stat-hours")).toBeInTheDocument();
      expect(screen.getByTestId("stat-rating")).toBeInTheDocument();

      // Check incoming offer modal and 45s countdown (WD3)
      await waitFor(() => {
        expect(screen.getByText("New Ride Offer Available!")).toBeInTheDocument();
      });
      expect(screen.getByTestId("offer-countdown")).toHaveTextContent(/s/);
      expect(screen.getByText("124 Cross Cut Road, Gandhipuram")).toBeInTheDocument();
    });

    it("handles concurrent offer race (409) with 'Trip no longer available' alert (T6.3)", async () => {
      globalFetch.mockImplementation(async (url: string) => {
        if (typeof url === "string" && url.includes("/accept")) {
          return {
            ok: false,
            status: 409,
            json: async () => ({
              code: "OFFER_ALREADY_CLAIMED",
              message: "Trip no longer available. Accepted by another driver.",
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      render(<DriverDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("New Ride Offer Available!")).toBeInTheDocument();
      });

      // Click accept offer
      const acceptBtn = screen.getByRole("button", { name: /Accept Offer/i });
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(screen.getByTestId("trip-unavailable-alert")).toHaveTextContent(
          "Trip no longer available"
        );
      });
    });

    it("blocks go-online when driver documents are unverified (T6.1)", async () => {
      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          code: "DOCUMENTS_UNVERIFIED",
          message:
            "Go-online blocked: documents unverified or expired. Please upload approved documents.",
        }),
      });

      render(<DriverDashboardPage />);

      const toggle = screen.getByTestId("online-toggle");
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(screen.getByTestId("doc-unverified-alert")).toHaveTextContent(
          "documents unverified or expired"
        );
      });
    });
  });

  describe("WD4 - WD7: Driver Trip Lifecycle (Navigate -> Arrive -> OTP -> Complete)", () => {
    it("walks through pickup arrival, 4-digit OTP entry, odometer, and amount to collect = ₹994 (T6.4 - T6.7)", async () => {
      render(<DriverTripLifecyclePage params={Promise.resolve({ id: "bk_101" })} />);

      // Step 1: Assigned -> Arrived
      expect(screen.getByTestId("gmaps-nav-btn")).toBeInTheDocument();
      // Mock API routing
      globalFetch.mockImplementation(async (url: string) => {
        if (url.includes("/arrived")) {
          return { ok: true, json: async () => ({ status: "driver_arrived" }) };
        }
        if (url.includes("/start")) {
          return { ok: true, json: async () => ({ status: "in_progress" }) };
        }
        if (url.includes("/complete")) {
          return {
            ok: true,
            json: async () => ({
              booking: { status: "completed" },
              amountToCollect: 99400,
            }),
          };
        }
        return { ok: true, json: async () => ({}) };
      });

      const arrivedBtn = screen.getByTestId("arrived-btn");
      fireEvent.click(arrivedBtn);

      // Step 2: Arrived -> Enter 4-digit start OTP
      await waitFor(() => {
        expect(screen.getByText(/Enter Passenger Start OTP/i)).toBeInTheDocument();
      });

      // Input 4 digits: 4321
      const digit1 = screen.getByLabelText("Digit 1 of 4");
      const digit2 = screen.getByLabelText("Digit 2 of 4");
      const digit3 = screen.getByLabelText("Digit 3 of 4");
      const digit4 = screen.getByLabelText("Digit 4 of 4");

      fireEvent.change(digit1, { target: { value: "4" } });
      fireEvent.change(digit2, { target: { value: "3" } });
      fireEvent.change(digit3, { target: { value: "2" } });
      fireEvent.change(digit4, { target: { value: "1" } });

      const verifyOtpBtn = screen.getByTestId("verify-otp-btn");
      fireEvent.click(verifyOtpBtn);

      // Step 3: In Progress -> Enter odometer
      await waitFor(() => {
        expect(screen.getByTestId("odometer-input")).toBeInTheDocument();
      });

      const odoInput = screen.getByTestId("odometer-input");
      fireEvent.change(odoInput, { target: { value: "45280" } });

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          booking: { status: "completed" },
          amountToCollect: 99400,
        }),
      });

      const endTripBtn = screen.getByTestId("end-trip-btn");
      fireEvent.click(endTripBtn);

      // Step 4: Complete -> Amount to collect = ₹994 (T6.6)
      await waitFor(() => {
        expect(screen.getByTestId("amount-to-collect")).toHaveTextContent("₹994");
      });
      expect(screen.getByText("Trip Completed Successfully")).toBeInTheDocument();
    });

    it("verifies OTP attempt limit locks after 5 failed attempts (T6.4)", async () => {
      render(<DriverTripLifecyclePage params={Promise.resolve({ id: "bk_101" })} />);

      fireEvent.click(screen.getByTestId("arrived-btn"));

      await waitFor(() => {
        expect(screen.getByLabelText("Digit 1 of 4")).toBeInTheDocument();
      });

      const digit1 = screen.getByLabelText("Digit 1 of 4");
      const digit2 = screen.getByLabelText("Digit 2 of 4");
      const digit3 = screen.getByLabelText("Digit 3 of 4");
      const digit4 = screen.getByLabelText("Digit 4 of 4");

      fireEvent.change(digit1, { target: { value: "0" } });
      fireEvent.change(digit2, { target: { value: "0" } });
      fireEvent.change(digit3, { target: { value: "0" } });
      fireEvent.change(digit4, { target: { value: "0" } });

      const verifyBtn = screen.getByTestId("verify-otp-btn");

      // Attempt 1 to 5
      for (let i = 1; i <= 5; i++) {
        globalFetch.mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            code: i >= 5 ? "OTP_LOCKED" : "INCORRECT_OTP",
            message:
              i >= 5 ? "Too many failed attempts. Trip verification locked." : `Attempt ${i} of 5`,
          }),
        });
        fireEvent.click(verifyBtn);
      }

      await waitFor(() => {
        expect(screen.getByTestId("otp-error-msg")).toHaveTextContent(
          "Too many failed attempts. Trip verification locked."
        );
      });
    });
  });

  describe("WD8: Earnings Page with Range Selector & Chart", () => {
    it("renders earnings metrics, range dropdown, and accessible table fallback (T6.10)", () => {
      render(<DriverEarningsPage />);

      expect(screen.getByTestId("earnings-total")).toBeInTheDocument();
      expect(screen.getByTestId("earnings-trips")).toBeInTheDocument();
      expect(screen.getByTestId("earnings-hours")).toBeInTheDocument();

      // Check range selector
      const rangeSelect = screen.getByTestId("earnings-range-select");
      expect(rangeSelect).toBeInTheDocument();

      // Check accessible table fallback exists for screen readers (T6.10)
      const accessibleTable = screen.getByRole("table", { hidden: true });
      expect(accessibleTable).toBeInTheDocument();
    });
  });

  describe("WD9: Driver Profile & Masked Bank Details", () => {
    it("masks bank account displaying only last 4 digits (T6.12)", () => {
      render(<DriverProfileDocumentsPage />);

      const bankElem = screen.getByTestId("masked-bank-account");
      expect(bankElem).toHaveTextContent("•••• •••• •••• 4321");

      // Verify document badges exist
      expect(screen.getByText("Commercial Driving License")).toBeInTheDocument();
      expect(screen.getByText("Vehicle Registration Certificate (RC)")).toBeInTheDocument();
      expect(screen.getByText("Comprehensive Commercial Insurance")).toBeInTheDocument();
    });

    it("rejects dangerous file extensions on upload (T6.11)", () => {
      render(<DriverProfileDocumentsPage />);

      const fileInput = screen.getByTestId("upload-license-input");
      const maliciousFile = new File(["malicious"], "trojan.exe", {
        type: "application/x-msdownload",
      });

      fireEvent.change(fileInput, { target: { files: [maliciousFile] } });

      expect(screen.getByTestId("doc-upload-error")).toHaveTextContent(
        "Dangerous file extension rejected"
      );
    });
  });
});
