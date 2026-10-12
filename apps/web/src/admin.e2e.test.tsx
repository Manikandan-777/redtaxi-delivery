// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import AdminDashboardPage from "./app/admin/page";
import AdminDriversPage from "./app/admin/drivers/page";
import AdminBookingsPage from "./app/admin/bookings/page";
import AdminDispatchPage from "./app/admin/dispatch/page";
import AdminPricingPage from "./app/admin/pricing/page";
import AdminTicketsPage from "./app/admin/tickets/page";
import AdminAnalyticsPage from "./app/admin/analytics/page";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/admin",
}));

describe("Phase 7: Web Admin Operations End-to-End Workflows", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("WA2: Admin Dashboard Page", () => {
    it("renders dashboard stat tiles with DEC-6 figures: 342, 14, 58, 3, 310", () => {
      render(<AdminDashboardPage />);

      expect(screen.getByTestId("admin-current-date")).toBeInTheDocument();
      expect(screen.getByTestId("tile-total-bookings")).toHaveTextContent("342");
      expect(screen.getByTestId("tile-active-rides")).toHaveTextContent("14");
      expect(screen.getByTestId("tile-drivers-online")).toHaveTextContent("58");
      expect(screen.getByTestId("tile-pending-drivers")).toHaveTextContent("3");
      expect(screen.getByTestId("tile-completed-today")).toHaveTextContent("310");
    });
  });

  describe("WA3 & WA4: Driver Verification Workflow", () => {
    it("opens verification modal, checks disabled approve for unverified docs, rejects with reason", () => {
      render(<AdminDriversPage />);

      // Search or find pending driver Arun Kumar
      const reviewBtn = screen.getByTestId("review-driver-drv_2");
      fireEvent.click(reviewBtn);

      // Verify modal is displayed
      expect(screen.getByText(/Driver Verification: Arun Kumar/)).toBeInTheDocument();

      // Approve button is disabled because not all docs are verified
      const approveBtn = screen.getByTestId("approve-driver-btn");
      expect(approveBtn).toBeDisabled();

      // Click reject driver
      const rejectBtn = screen.getByTestId("reject-driver-btn");
      fireEvent.click(rejectBtn);

      // Fill reason in confirm dialog
      const reasonInput = screen.getByTestId("reject-reason-input");
      fireEvent.change(reasonInput, { target: { value: "Insurance certificate expired" } });

      const confirmRejectBtn = screen.getByRole("button", { name: "Confirm Rejection" });
      fireEvent.click(confirmRejectBtn);

      // Status notice shown
      expect(screen.getByRole("status")).toHaveTextContent("rejected with reason");
    });
  });

  describe("WA5: Bookings Management Workflow", () => {
    it("renders bookings table, opens details, and supports reassign action", () => {
      render(<AdminBookingsPage />);

      expect(screen.getByText("#BK10234")).toBeInTheDocument();
      const detailsBtn = screen.getByTestId("view-booking-BK10234");
      fireEvent.click(detailsBtn);

      expect(screen.getByText("Trip Status Timeline")).toBeInTheDocument();
      const reassignBtn = screen.getByTestId("reassign-btn");
      fireEvent.click(reassignBtn);

      const confirmBtn = screen.getByRole("button", { name: "Confirm Action" });
      fireEvent.click(confirmBtn);

      expect(screen.getByRole("status")).toHaveTextContent("reassigned to");
    });
  });

  describe("WA6: Live Dispatch Nearby Drivers", () => {
    it("renders nearby drivers sorted by distance and allows assigning", () => {
      render(<AdminDispatchPage />);

      expect(screen.getByTestId("dispatch-map-view")).toBeInTheDocument();
      // Nearest driver Selvam (1.2 km)
      expect(screen.getByTestId("driver-card-drv_1")).toBeInTheDocument();

      const assignBtn = screen.getByTestId("assign-btn-drv_1");
      expect(assignBtn).not.toBeDisabled();
      fireEvent.click(assignBtn);

      const confirmBtn = screen.getByRole("button", { name: "Confirm Assignment" });
      fireEvent.click(confirmBtn);

      expect(screen.getByRole("status")).toHaveTextContent("successfully assigned");
    });
  });

  describe("WA7: Pricing Rules & Diff Modal", () => {
    it("tracks dirty state, triggers diff confirmation, and validates input", () => {
      render(<AdminPricingPage />);

      const rateInput = screen.getByTestId("pricing-base-rate-input");
      fireEvent.change(rateInput, { target: { value: "18.50" } });

      const saveBtn = screen.getByTestId("save-pricing-btn");
      expect(saveBtn).not.toBeDisabled();
      fireEvent.click(saveBtn);

      expect(screen.getByText("Confirm Price Change for Sedan")).toBeInTheDocument();
      expect(screen.getByText(/16.00/)).toBeInTheDocument();
      expect(screen.getByText(/18.50/)).toBeInTheDocument();

      const confirmTariffBtn = screen.getByRole("button", { name: "Confirm & Apply Tariff" });
      fireEvent.click(confirmTariffBtn);

      expect(screen.getByRole("status")).toHaveTextContent(
        "Pricing rule for Sedan saved successfully"
      );
    });
  });

  describe("WA8: Support Tickets", () => {
    it("renders tickets list and allows resolving a ticket", () => {
      render(<AdminTicketsPage />);

      expect(screen.getByTestId("ticket-card-STK1001")).toBeInTheDocument();
      const viewBtn = screen.getByTestId("view-ticket-STK1001");
      fireEvent.click(viewBtn);

      const resolveBtn = screen.getByTestId("resolve-ticket-btn");
      fireEvent.click(resolveBtn);

      const confirmResolveBtn = screen.getByRole("button", { name: "Confirm Resolution" });
      fireEvent.click(confirmResolveBtn);

      expect(screen.getByRole("status")).toHaveTextContent("marked as resolved");
    });
  });

  describe("WA9: Analytics Page", () => {
    it("renders 90.6% completion rate tile and accessible table fallback", () => {
      render(<AdminAnalyticsPage />);

      expect(screen.getByTestId("tile-completion-rate")).toHaveTextContent("90.6%");
      expect(screen.getByTestId("tile-total-revenue")).toHaveTextContent("₹2,48,500");
      expect(
        screen.getByRole("table", { name: /Daily Analytics Breakdown Table/i })
      ).toBeInTheDocument();
    });
  });
});
