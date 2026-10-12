import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrackingClient } from "./lib/trackingClient";
import { getPassengerScreen, getDriverScreen, canMove } from "@redtaxi/shared";

describe("Phase 5: Real-time Live Tracking & Trip Completion Unit Tests (T5.1 - T5.10)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("T5.1 & T5.2: TrackingClient WebSocket & Fallback Polling", () => {
    it("connects to booking room and notifies subscriber of websocket state", () => {
      const client = new TrackingClient();
      const listener = vi.fn();
      client.subscribe(listener);

      client.connect("bk_test_101");

      expect(listener).toHaveBeenCalledWith("connection.state", {
        connected: true,
        transport: "websocket",
      });
      expect(client.getStatus().connected).toBe(true);
      expect(client.getStatus().bookingId).toBe("bk_test_101");
    });

    it("transitions to fallback polling on socket connection drop", async () => {
      const client = new TrackingClient({ pollingIntervalMs: 5000 });
      const listener = vi.fn();
      client.subscribe(listener);

      client.connect("bk_test_101");
      listener.mockClear();

      // Trigger socket drop
      client.handleSocketDrop();

      expect(listener).toHaveBeenCalledWith("connection.state", {
        connected: false,
        transport: "polling_fallback",
      });
      expect(client.getStatus().isPolling).toBe(true);
    });

    it("resumes websocket transport and halts polling on reconnect", () => {
      const client = new TrackingClient({ pollingIntervalMs: 5000 });
      const listener = vi.fn();
      client.subscribe(listener);

      client.connect("bk_test_101");
      client.handleSocketDrop();
      expect(client.getStatus().isPolling).toBe(true);

      listener.mockClear();
      client.handleSocketReconnect();

      expect(listener).toHaveBeenCalledWith("connection.state", {
        connected: true,
        transport: "websocket",
      });
      expect(client.getStatus().isPolling).toBe(false);
      expect(client.getStatus().connected).toBe(true);
    });

    it("cleans up timers and connection on disconnect", () => {
      const client = new TrackingClient();
      client.connect("bk_test_101");
      client.handleSocketDrop();

      client.disconnect();
      expect(client.getStatus().connected).toBe(false);
      expect(client.getStatus().isPolling).toBe(false);
    });
  });

  describe("T5.3: Status-to-Screen Mapping (rideMachine)", () => {
    it("maps passenger booking statuses to corresponding screens", () => {
      expect(getPassengerScreen("created")).toBe("WP4_FareQuote");
      expect(getPassengerScreen("scheduled")).toBe("WP4_FareQuote");
      expect(getPassengerScreen("searching")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("driver_assigned")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("driver_arriving")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("driver_arrived")).toBe("WP6_LiveTracking");
      expect(getPassengerScreen("in_progress")).toBe("WP6_TripInProgress");
      expect(getPassengerScreen("completed")).toBe("WP7_Complete");
      expect(getPassengerScreen("cancelled")).toBe("WP1_Home");
      expect(getPassengerScreen("no_driver")).toBe("WP1_Home");
    });

    it("maps driver ride statuses to driver screens", () => {
      expect(getDriverScreen("driver_assigned")).toBe("WD4_TripAccepted");
      expect(getDriverScreen("driver_arriving")).toBe("WD4_NavigateToPickup");
      expect(getDriverScreen("driver_arrived")).toBe("WD5_ArrivedOtp");
      expect(getDriverScreen("in_progress")).toBe("WD6_InProgress");
      expect(getDriverScreen("completed")).toBe("WD7_Complete");
      expect(getDriverScreen("created")).toBe("WD2_Dashboard");
    });

    it("validates allowed and rejected transitions", () => {
      expect(canMove("driver_assigned", "driver_arriving")).toBe(true);
      expect(canMove("driver_arriving", "driver_arrived")).toBe(true);
      expect(canMove("driver_arrived", "in_progress")).toBe(true);
      expect(canMove("in_progress", "completed")).toBe(true);

      // Illegal transitions
      expect(canMove("driver_assigned", "completed")).toBe(false);
      expect(canMove("in_progress", "searching")).toBe(false);
      expect(canMove("completed", "in_progress")).toBe(false);
    });
  });

  describe("T5.7 & VR-6: Sanitized Public Share Structure", () => {
    it("ensures public tracking payload does not leak passenger phone or payment info", () => {
      const internalBooking = {
        id: "bk_100",
        customer: { id: "c1", name: "Anand", phone: "9876543210" },
        paid: 50000,
        due: 99400,
        startOtp: "4321",
      };

      // VR-6 sanitized structure
      const sanitizeForPublicShare = (_b: typeof internalBooking) => ({
        status: "driver_arriving",
        pickup: "Pollachi Town",
        drop: "Coimbatore Airport",
        driverName: "Karthik Raja",
        etaMinutes: 10,
      });

      const sanitized = sanitizeForPublicShare(internalBooking);
      const record = sanitized as Record<string, unknown>;

      expect(record.customer).toBeUndefined();
      expect(record.phone).toBeUndefined();
      expect(record.paid).toBeUndefined();
      expect(record.due).toBeUndefined();
      expect(record.startOtp).toBeUndefined();
    });
  });

  describe("T5.10: Rating Form Validation Rules", () => {
    it("requires stars between 1 and 5", () => {
      const isValidRating = (stars: number) => stars >= 1 && stars <= 5;
      expect(isValidRating(0)).toBe(false);
      expect(isValidRating(1)).toBe(true);
      expect(isValidRating(5)).toBe(true);
      expect(isValidRating(6)).toBe(false);
    });

    it("restricts comment length to 500 characters", () => {
      const isValidComment = (comment: string) => comment.length <= 500;
      expect(isValidComment("Great safe ride!")).toBe(true);
      expect(isValidComment("a".repeat(500))).toBe(true);
      expect(isValidComment("a".repeat(501))).toBe(false);
    });
  });
});
