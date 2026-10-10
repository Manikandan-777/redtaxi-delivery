import express from "express";
import cors from "cors";
import {
  computeFare,
  calculateDepositOptions,
  canMove,
  paise,
  type Booking,
  type BookingStatus,
  type FareQuote,
  type PricingRule,
  type VehicleClass,
  type TripMode,
} from "@redtaxi/shared";
import { SEED_PRICING_RULES, SEED_VEHICLES, SEED_DRIVER } from "./seed";

export function createMockApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // In-memory store
  const quotes = new Map<string, FareQuote>();
  const bookings = new Map<string, Booking>();
  const pricingRules = new Map<VehicleClass, PricingRule>(
    SEED_PRICING_RULES.map((r) => [r.vehicleClass, r])
  );

  // ── Vehicles & Tariff ──────────────────────────────────────────────────────
  app.get("/vehicles", (_req, res) => {
    res.json(SEED_VEHICLES);
  });

  app.get("/tariff", (_req, res) => {
    res.json(Array.from(pricingRules.values()));
  });

  // ── Quotes ─────────────────────────────────────────────────────────────────
  app.post("/quotes", (req, res) => {
    const { pickup, drop, vehicleClass, mode, distanceKmOverride } = req.body;

    if (!pickup || !drop || !vehicleClass || !mode) {
      return res.status(400).json({ code: "BAD_REQUEST", message: "Missing required fields" });
    }

    const rule = pricingRules.get(vehicleClass as VehicleClass);
    if (!rule) {
      return res
        .status(400)
        .json({ code: "INVALID_VEHICLE", message: `Unknown vehicle class ${vehicleClass}` });
    }

    // Fixed distance estimation for mock
    const distanceKm = typeof distanceKmOverride === "number" ? distanceKmOverride : 65.2;
    const durationMin = Math.round(distanceKm * 1.3); // ~85 min

    // MinKm applies to outstation trips only (DEC-5, DEC-15)
    // Within 75 km radius of Pollachi is local/transfer, so actual km is billed without minKm
    const isOutstation = (mode === "one_way" && distanceKm > 75) || mode === "round_trip";
    const minKm = isOutstation ? rule.minOutstationKm : 0;

    // Server-side fare re-computation
    const fare = computeFare({
      distanceKm,
      ratePerKm: rule.baseRatePerKm,
      batta: rule.dailyBatta,
      tollEstimate: paise(8000), // ₹80.00
      nightAllowance: paise(0),
      minKm,
    });

    const depositOptions = calculateDepositOptions(fare.total, {
      advanceDepositPercent: rule.advanceDepositPercent,
      minDeposit: rule.minDeposit,
    });

    const quoteId = `qt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const quote: FareQuote = {
      id: quoteId,
      vehicleId: `veh_${vehicleClass}_1`,
      mode: mode as TripMode,
      distanceKm,
      durationMin,
      lines: fare.lines,
      total: fare.total,
      depositOptions,
      // Valid for exactly 15 minutes (T1.13)
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    quotes.set(quoteId, quote);
    return res.json(quote);
  });

  app.get("/quotes/:id", (req, res) => {
    const quote = quotes.get(req.params.id);
    if (!quote) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Quote not found" });
    }
    return res.json(quote);
  });

  // ── Bookings ───────────────────────────────────────────────────────────────
  app.post("/bookings", (req, res) => {
    const { quoteId, paymentOption, customerName, clientAmount: _clientAmount } = req.body;

    if (!quoteId || !paymentOption) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "quoteId and paymentOption are required" });
    }

    const quote = quotes.get(quoteId);
    if (!quote) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Quote not found" });
    }

    // T1.13: Quote expiry verification (15 minutes limit)
    const now = Date.now();
    const expiryTime = new Date(quote.validUntil).getTime();
    if (now > expiryTime) {
      return res
        .status(400)
        .json({ code: "QUOTE_EXPIRED", message: "Quote has expired. Please request a new quote." });
    }

    // T1.12: Server IGNORES any client-sent amounts completely
    // Uses quote deposit option as authoritative
    const selectedDeposit = quote.depositOptions.find((d) => d.type === paymentOption);
    if (!selectedDeposit) {
      return res
        .status(400)
        .json({ code: "INVALID_PAYMENT_OPTION", message: "Invalid payment option" });
    }

    // Even if client sends clientAmount, server ignores it
    const paid = selectedDeposit.payNow;
    const due = selectedDeposit.payAtDrop;

    const bookingId = `bk_${Date.now()}`;
    const code = `BK${Math.floor(10000 + Math.random() * 90000)}`;

    const booking: Booking = {
      id: bookingId,
      code,
      customer: {
        id: "cust_1",
        name: customerName || "Anand",
        phone: "9876543210",
      },
      pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
      drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
      startsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      status: "created",
      quote,
      startOtp: "4321", // 4 digits ride start OTP
      paid,
      due,
      timeline: [{ status: "created", at: new Date().toISOString() }],
    };

    bookings.set(bookingId, booking);
    return res.status(201).json(booking);
  });

  app.get("/bookings", (_req, res) => {
    return res.json(Array.from(bookings.values()));
  });

  app.get("/bookings/:id", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    return res.json(booking);
  });

  // Booking state transition endpoint
  app.post("/bookings/:id/transition", (req, res) => {
    const { nextStatus } = req.body;
    const booking = bookings.get(req.params.id);

    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }

    // T1.12: Server enforces state transitions and rejects illegal transitions with { code, message }
    if (!canMove(booking.status, nextStatus as BookingStatus)) {
      return res.status(400).json({
        code: "ILLEGAL_TRANSITION",
        message: `Cannot transition booking from ${booking.status} to ${nextStatus}`,
      });
    }

    booking.status = nextStatus as BookingStatus;
    booking.timeline.push({ status: booking.status, at: new Date().toISOString() });

    if (booking.status === "driver_assigned") {
      booking.driver = SEED_DRIVER;
    }

    return res.json(booking);
  });

  // ── Driver & Admin Stats ───────────────────────────────────────────────────
  app.get("/admin/stats", (_req, res) => {
    res.json({
      totalBookingsToday: 342,
      activeRides: 14,
      driversOnline: 58,
      pendingDrivers: 3,
      completedToday: 310,
    });
  });

  return app;
}
