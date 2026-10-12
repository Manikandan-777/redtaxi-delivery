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

// Allowed origins for SC-D4 CORS
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://redtaxi.internal",
  "http://localhost:8081",
];

export function createMockApp() {
  const app = express();
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());

  // In-memory store
  const quotes = new Map<string, FareQuote>();
  const bookings = new Map<string, Booking>();
  const pricingRules = new Map<VehicleClass, PricingRule>(
    SEED_PRICING_RULES.map((r) => [r.vehicleClass, r])
  );

  // Auth helper for SC-B1 role walls on API
  const requireApiAuth = (allowedRoles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ code: "UNAUTHORIZED", message: "Missing authorization token" });
      }
      const token = auth.slice(7);
      // For mock API: accept valid role mock tokens or demo tokens
      if (token.includes("admin") && allowedRoles.includes("admin")) {
        return next();
      }
      if (token.includes("driver") && allowedRoles.includes("driver")) {
        return next();
      }
      if (token.includes("passenger") && allowedRoles.includes("passenger")) {
        return next();
      }
      // Or valid JWT structure test
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    };
  };

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

  // ── Payments (Razorpay Mock) ───────────────────────────────────────────────
  const paymentOrders = new Map<
    string,
    { orderId: string; amount: number; quoteId: string; paymentOption: string }
  >();

  app.post("/payments/orders", (req, res) => {
    const { quoteId, paymentOption, idempotencyKey: _idempotencyKey } = req.body;
    if (!quoteId || !paymentOption) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "quoteId and paymentOption required" });
    }

    const quote = quotes.get(quoteId);
    if (!quote) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Quote not found" });
    }

    const deposit = quote.depositOptions.find((d) => d.type === paymentOption);
    if (!deposit) {
      return res
        .status(400)
        .json({ code: "INVALID_PAYMENT_OPTION", message: "Invalid payment option" });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const order = {
      orderId,
      amount: deposit.payNow,
      currency: "INR",
      quoteId,
      paymentOption,
    };
    paymentOrders.set(orderId, order);
    return res.json({ orderId, amount: deposit.payNow, currency: "INR" });
  });

  app.post("/payments/verify", (req, res) => {
    const { orderId, paymentId, signature, quoteId } = req.body;
    if (!orderId || !paymentId || !signature || !quoteId) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Missing payment verification parameters" });
    }

    const order = paymentOrders.get(orderId);
    if (!order) {
      return res.status(404).json({ code: "ORDER_NOT_FOUND", message: "Order not found" });
    }

    const quote = quotes.get(quoteId);
    if (!quote) {
      return res.status(404).json({ code: "QUOTE_NOT_FOUND", message: "Quote not found" });
    }

    // Verify mock signature (accept test-mode signature or valid string)
    if (!signature.startsWith("sig_") && signature !== "valid_signature") {
      return res
        .status(400)
        .json({ code: "INVALID_SIGNATURE", message: "Invalid Razorpay payment signature" });
    }

    const depositFallback = quote.depositOptions[0] || { payNow: quote.total, payAtDrop: paise(0) };
    const selectedDeposit =
      quote.depositOptions.find((d) => d.type === order.paymentOption) || depositFallback;
    const bookingId = `bk_${Date.now()}`;
    const code = `BK${Math.floor(10000 + Math.random() * 90000)}`;

    const booking: Booking = {
      id: bookingId,
      code,
      customer: {
        id: "cust_1",
        name: "Anand",
        phone: "9876543210",
      },
      pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
      drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
      startsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      status: "created",
      quote,
      startOtp: "4321",
      paid: selectedDeposit.payNow,
      due: selectedDeposit.payAtDrop,
      timeline: [{ status: "created", at: new Date().toISOString() }],
    };

    bookings.set(bookingId, booking);
    return res.json({ success: true, booking });
  });

  app.get("/bookings", requireApiAuth(["passenger", "driver", "admin"]), (_req, res) => {
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

  // ── Phase 5: Tracking, SOS, Share, Ratings ──────────────────────────────
  const publicTrackingTokens = new Map<string, { bookingId: string; expiresAt: string }>();

  // SOS endpoint (T5.6 & SC-E4)
  app.post("/bookings/:id/sos", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    const { lat, lng } = req.body;
    return res.json({
      success: true,
      alertId: `sos_${Date.now()}`,
      bookingId: booking.id,
      lat: lat ?? booking.pickup.lat,
      lng: lng ?? booking.pickup.lng,
      message: "Emergency response team and nearby drivers alerted.",
      triggeredAt: new Date().toISOString(),
    });
  });

  // Cancel with reason (T5.8)
  app.post("/bookings/:id/cancel", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    const { reason } = req.body;
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Cancellation reason is required" });
    }
    booking.status = "cancelled";
    booking.timeline.push({ status: "cancelled", at: new Date().toISOString() });
    return res.json({ success: true, booking, reason });
  });

  // Complete and Rate (T5.10 & DEC-10)
  app.post("/bookings/:id/rate", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    const { stars, comment } = req.body;
    if (typeof stars !== "number" || stars < 1 || stars > 5) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Stars rating must be between 1 and 5" });
    }
    if (comment && comment.length > 500) {
      return res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Comment cannot exceed 500 characters" });
    }
    return res.json({
      success: true,
      bookingId: booking.id,
      stars,
      comment: comment || "",
      message: "Thank you for your feedback! Ride completed.",
    });
  });

  // Tokenised Public Share (T5.7 & VR-6)
  app.post("/bookings/:id/share", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    const token = `trk_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    publicTrackingTokens.set(token, { bookingId: booking.id, expiresAt });
    return res.json({
      token,
      shareUrl: `http://localhost:3000/t/${token}`,
      expiresAt,
    });
  });

  // Public Tracking View (VR-6: sanitized minimal data, zero phone/payment data)
  app.get("/public/tracking/:token", (req, res) => {
    const record = publicTrackingTokens.get(req.params.token);
    if (!record) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Tracking link expired or invalid" });
    }
    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({ code: "EXPIRED", message: "Tracking link has expired" });
    }
    const booking = bookings.get(record.bookingId);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    // Return sanitized data only (no customer phone, no payment/fare details)
    return res.json({
      status: booking.status,
      pickup: booking.pickup,
      drop: booking.drop,
      driver: booking.driver
        ? {
            name: booking.driver.name,
            vehicleNo: booking.driver.vehicleNo,
            vehicleClass: booking.driver.vehicleClass,
            rating: booking.driver.rating,
          }
        : null,
      etaMinutes: 12,
    });
  });

  // ── Protected Admin Endpoints (SC-B1) ──────────────────────────────────────
  app.get("/admin/stats", requireApiAuth(["admin"]), (_req, res) => {
    res.json({
      totalBookingsToday: 342,
      activeRides: 14,
      driversOnline: 58,
      pendingDrivers: 3,
      completedToday: 310,
    });
  });

  app.get("/admin/drivers", requireApiAuth(["admin"]), (_req, res) => {
    res.json([SEED_DRIVER]);
  });

  // ── Protected Driver Endpoints (SC-B1 & Phase 6) ─────────────────────────
  interface DriverDoc {
    id: string;
    documentType: "license" | "rc" | "insurance";
    status: "pending" | "approved" | "rejected";
    fileUrl?: string;
  }

  const driverState = {
    id: SEED_DRIVER.id,
    name: SEED_DRIVER.name,
    phone: SEED_DRIVER.phone,
    rating: SEED_DRIVER.rating,
    vehicleNo: SEED_DRIVER.vehicleNo,
    vehicleClass: SEED_DRIVER.vehicleClass,
    online: true,
    status: SEED_DRIVER.status,
    bankAccountNumber: "•••• •••• •••• 4321", // T6.12 & SC-F3: masked in all representations
    documents: [
      { id: "doc_lic_1", documentType: "license", status: "approved" },
      { id: "doc_rc_1", documentType: "rc", status: "approved" },
      { id: "doc_ins_1", documentType: "insurance", status: "approved" },
    ] as DriverDoc[],
  };

  // Offers in memory
  interface DriverOffer {
    id: string;
    bookingId: string;
    expiresAt: string;
    pickup: { label: string; lat: number; lng: number };
    drop: { label: string; lat: number; lng: number };
    fare: number; // paise
    claimedBy?: string;
  }

  const offers = new Map<string, DriverOffer>();
  // Seed sample offer (45s window)
  const defaultOffer: DriverOffer = {
    id: "off_seed_101",
    bookingId: "bk_seed_offer_1",
    expiresAt: new Date(Date.now() + 45 * 1000).toISOString(),
    pickup: { label: "124 Cross Cut Road, Gandhipuram", lat: 11.0168, lng: 76.9558 },
    drop: { label: "Coimbatore International Airport", lat: 11.029, lng: 77.043 },
    fare: 149400, // ₹1,494 in paise
  };
  offers.set(defaultOffer.id, defaultOffer);

  // OTP attempts tracker: bookingId -> attemptCount (max 5)
  const otpAttempts = new Map<string, number>();

  // T6.1: Go-online blocked when any document is unverified or expired
  app.post("/driver/online", (req, res) => {
    const { online } = req.body;
    if (typeof online !== "boolean") {
      return res.status(400).json({ code: "BAD_REQUEST", message: "online boolean required" });
    }

    const hasUnverifiedDocs = driverState.documents.some((d) => d.status !== "approved");
    if (online && hasUnverifiedDocs) {
      return res.status(403).json({
        code: "DOCUMENTS_UNVERIFIED",
        message:
          "Cannot go online. All vehicle and identity documents must be verified and approved.",
      });
    }

    driverState.online = online;
    return res.json({ online: driverState.online });
  });

  // T6.1 & Stats (SC-B1 role wall)
  app.get("/driver/stats", requireApiAuth(["driver", "admin"]), (_req, res) => {
    return res.json({
      todayTrips: 4,
      todayEarnings: 245000,
      hoursOnline: 6.5,
      rating: driverState.rating,
      online: driverState.online,
    });
  });

  // T6.2: Offer countdown using server expiresAt
  app.get("/driver/offers/:id", (req, res) => {
    const offer = offers.get(req.params.id);
    if (!offer) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Offer not found" });
    }
    return res.json(offer);
  });

  // T6.3: Accept incoming offer with concurrency / race resolution (409 if claimed)
  app.post("/offers/:id/accept", (req, res) => {
    const offer = offers.get(req.params.id);
    if (!offer) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Offer not found" });
    }

    // Check expiry
    if (new Date(offer.expiresAt).getTime() < Date.now()) {
      return res.status(410).json({
        code: "OFFER_EXPIRED",
        message: "This offer has expired.",
      });
    }

    // Concurrency / Race handling (T6.3)
    if (offer.claimedBy) {
      return res.status(409).json({
        code: "OFFER_ALREADY_CLAIMED",
        message: "Trip no longer available. Accepted by another driver.",
      });
    }

    // Claim the offer
    offer.claimedBy = driverState.id;

    // Fetch or create booking
    let booking = bookings.get(offer.bookingId);
    if (!booking) {
      const bookingId = offer.bookingId;
      booking = {
        id: bookingId,
        code: "BK10234",
        customer: { id: "cust_1", name: "Anand" }, // T6.14: masked/no direct phone
        pickup: offer.pickup,
        drop: offer.drop,
        startsAt: new Date().toISOString(),
        status: "driver_assigned",
        quote: {
          id: "qt_seed_1",
          vehicleId: "veh_sedan_1",
          mode: "one_way",
          distanceKm: 65.2,
          durationMin: 85,
          lines: [],
          total: paise(offer.fare),
          depositOptions: [],
          validUntil: new Date(Date.now() + 900000).toISOString(),
        },
        driver: {
          id: driverState.id,
          name: driverState.name,
          rating: driverState.rating,
          vehicleNo: driverState.vehicleNo,
          vehicleClass: driverState.vehicleClass,
        },
        startOtp: "4321",
        paid: paise(50000), // ₹500
        due: paise(99400), // ₹994
        timeline: [
          { status: "created", at: new Date().toISOString() },
          { status: "driver_assigned", at: new Date().toISOString() },
        ],
      };
      bookings.set(bookingId, booking);
    } else {
      booking.status = "driver_assigned";
      booking.driver = {
        id: driverState.id,
        name: driverState.name,
        rating: driverState.rating,
        vehicleNo: driverState.vehicleNo,
        vehicleClass: driverState.vehicleClass,
      };
      booking.timeline.push({ status: "driver_assigned", at: new Date().toISOString() });
    }

    return res.json(booking);
  });

  // Decline offer
  app.post("/offers/:id/decline", (req, res) => {
    const offer = offers.get(req.params.id);
    if (!offer) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Offer not found" });
    }
    return res.json({ declined: true, id: offer.id });
  });

  // T6.3 / WD4: Mark driver arrived
  app.post("/bookings/:id/arrived", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }
    booking.status = "driver_arrived";
    booking.timeline.push({ status: "driver_arrived", at: new Date().toISOString() });
    return res.json(booking);
  });

  // T6.4 & T6.5: Verify 4-digit start OTP with 5 attempts limit
  app.post("/bookings/:id/start", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }

    const { otp } = req.body;
    if (!otp || typeof otp !== "string" || !/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        code: "INVALID_FORMAT",
        message: "Start OTP must be exactly 4 numeric digits",
      });
    }

    const attempts = (otpAttempts.get(booking.id) || 0) + 1;
    otpAttempts.set(booking.id, attempts);

    if (attempts > 5) {
      return res.status(400).json({
        code: "OTP_LOCKED",
        message: "Too many failed attempts. Trip verification locked. Contact dispatch support.",
      });
    }

    const expectedOtp = booking.startOtp || "4321";
    if (otp !== expectedOtp) {
      return res.status(400).json({
        code: "INCORRECT_OTP",
        message: `Incorrect OTP. Attempt ${attempts} of 5.`,
        attemptsRemaining: 5 - attempts,
      });
    }

    // Correct OTP -> Transition to in_progress
    booking.status = "in_progress";
    booking.timeline.push({ status: "in_progress", at: new Date().toISOString() });
    return res.json(booking);
  });

  // T6.6 & T6.7: Complete trip with numeric odometer; compute amountToCollect = total - paid
  app.post("/bookings/:id/complete", (req, res) => {
    const booking = bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Booking not found" });
    }

    const { odometer } = req.body;
    if (odometer === undefined || typeof odometer !== "number" || isNaN(odometer) || odometer < 0) {
      return res.status(400).json({
        code: "INVALID_ODOMETER",
        message: "Odometer must be a valid non-negative number.",
      });
    }

    booking.status = "completed";
    booking.timeline.push({ status: "completed", at: new Date().toISOString() });

    // DEC-1 & DEC-10: amountToCollect = total - paid
    const totalAmount = booking.quote?.total ?? paise(149400);
    const paidAmount = booking.paid ?? paise(50000);
    const amountToCollect = paise(Math.max(0, totalAmount - paidAmount)); // ₹994 (99400 paise)

    return res.json({
      booking,
      amountToCollect,
      odometer,
    });
  });

  // T6.10: Earnings report by range (today/week/month)
  app.get("/driver/earnings", (req, res) => {
    const range = (req.query.range as string) || "week";

    if (range === "today") {
      return res.json({
        range: "today",
        totalEarnings: 245000, // ₹2,450
        tripsCount: 4,
        onlineHours: 6.5,
        history: [{ date: "Today", amount: 245000 }],
      });
    }

    if (range === "month") {
      return res.json({
        range: "month",
        totalEarnings: 4850000, // ₹48,500
        tripsCount: 92,
        onlineHours: 148,
        history: [
          { date: "Week 1", amount: 1200000 },
          { date: "Week 2", amount: 1150000 },
          { date: "Week 3", amount: 1300000 },
          { date: "Week 4", amount: 1200000 },
        ],
      });
    }

    // Default: week (Mon–Sun)
    return res.json({
      range: "week",
      totalEarnings: 1245000, // ₹12,450
      tripsCount: 22,
      onlineHours: 34.5,
      history: [
        { date: "Mon", amount: 180000 },
        { date: "Tue", amount: 155000 },
        { date: "Wed", amount: 210000 },
        { date: "Thu", amount: 195000 },
        { date: "Fri", amount: 240000 },
        { date: "Sat", amount: 165000 },
        { date: "Sun", amount: 100000 },
      ],
    });
  });

  // T6.12: Driver profile with masked bank account
  app.get("/driver/profile", (_req, res) => {
    return res.json({
      id: driverState.id,
      name: driverState.name,
      phone: driverState.phone,
      vehicleNo: driverState.vehicleNo,
      vehicleClass: driverState.vehicleClass,
      bankAccountNumberMasked: driverState.bankAccountNumber,
      documents: driverState.documents,
      rating: driverState.rating,
      online: driverState.online,
    });
  });

  app.put("/driver/profile", (req, res) => {
    const { name } = req.body;
    if (name && typeof name === "string") {
      driverState.name = name;
    }
    return res.json({ success: true, name: driverState.name });
  });

  // T6.11: Document upload with validation
  app.post("/driver/documents", (req, res) => {
    const { documentType, fileName, fileBase64, fileSize } = req.body;

    if (!["license", "rc", "insurance"].includes(documentType)) {
      return res.status(400).json({
        code: "INVALID_DOC_TYPE",
        message: "documentType must be license, rc, or insurance",
      });
    }

    // Check size limit: 10 MB
    if (fileSize && fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({
        code: "FILE_TOO_LARGE",
        message: "Document file exceeds 10MB limit.",
      });
    }

    // Check extension & magic bytes / header
    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith(".exe") || lower.endsWith(".html") || lower.endsWith(".js")) {
        return res.status(400).json({
          code: "INVALID_FILE_TYPE",
          message: "Executable or dangerous file types rejected.",
        });
      }
    }

    if (fileBase64 && typeof fileBase64 === "string") {
      // Magic bytes validation check
      // PDF: %PDF (25 50 44 46) -> JVBERi
      // PNG: \x89PNG -> iVBOR
      // JPEG: \xFF\xD8 -> /9j/
      const isAllowedMagic =
        fileBase64.startsWith("JVBERi") ||
        fileBase64.startsWith("iVBOR") ||
        fileBase64.startsWith("/9j/");

      if (!isAllowedMagic) {
        return res.status(400).json({
          code: "MAGIC_BYTE_MISMATCH",
          message: "File magic bytes mismatch. Only valid PDF, PNG, or JPEG permitted.",
        });
      }
    }

    // Update document status to pending/approved
    const docIdx = driverState.documents.findIndex((d) => d.documentType === documentType);
    const existingDoc = driverState.documents[docIdx];
    if (existingDoc) {
      existingDoc.status = "approved";
    } else {
      driverState.documents.push({
        id: `doc_${Date.now()}`,
        documentType,
        status: "approved",
      });
    }

    return res.json({
      id: `doc_${documentType}_${Date.now()}`,
      status: "approved",
      message: `${documentType} successfully uploaded and verified.`,
    });
  });

  // SC-H3: Custom error handler to prevent internal stack traces leaking
  app.use(
    (
      err: Error & { status?: number },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      return res.status(err.status || 500).json({
        code: "INTERNAL_ERROR",
        message: err.message || "An unexpected error occurred",
      });
    }
  );

  return app;
}
