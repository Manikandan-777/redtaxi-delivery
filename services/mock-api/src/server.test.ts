import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createMockApp } from "./server";

describe("Mock API Integration Tests (T1.12 & T1.13)", () => {
  let app: ReturnType<typeof createMockApp>;

  beforeEach(() => {
    app = createMockApp();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("T1.12: Server ignores client-sent amounts & enforces state transitions", () => {
    it("ignores client-sent amount and computes correct authoritative amounts", async () => {
      // 1. Create a quote
      const quoteRes = await request(app)
        .post("/quotes")
        .send({
          pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
          drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
          vehicleClass: "sedan",
          mode: "one_way",
        })
        .expect(200);

      const quote = quoteRes.body;
      expect(quote.total).toBe(149400); // authoritative 149400 paise

      // 2. Client attempts to tamper with paid amount by sending 100 paise (₹1)
      const bookingRes = await request(app)
        .post("/bookings")
        .send({
          quoteId: quote.id,
          paymentOption: "deposit",
          clientAmount: 100, // malicious or tampered amount
        })
        .expect(201);

      const booking = bookingRes.body;
      // Server ignored clientAmount and used authoritative payNow: 50000 paise (₹500)
      expect(booking.paid).toBe(50000);
      expect(booking.due).toBe(99400);
      expect(booking.paid + booking.due).toBe(149400);
    });

    it("rejects illegal state transition with { code, message }", async () => {
      // 1. Create quote & booking
      const quoteRes = await request(app)
        .post("/quotes")
        .send({
          pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
          drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
          vehicleClass: "sedan",
          mode: "one_way",
        });

      const bookingRes = await request(app).post("/bookings").send({
        quoteId: quoteRes.body.id,
        paymentOption: "full",
      });

      const bookingId = bookingRes.body.id;
      expect(bookingRes.body.status).toBe("created");

      // 2. Attempt illegal transition: created -> completed
      const illegalRes = await request(app)
        .post(`/bookings/${bookingId}/transition`)
        .send({ nextStatus: "completed" })
        .expect(400);

      expect(illegalRes.body.code).toBe("ILLEGAL_TRANSITION");
      expect(illegalRes.body.message).toContain("Cannot transition");

      // 3. Perform legal transition: created -> searching
      const legalRes = await request(app)
        .post(`/bookings/${bookingId}/transition`)
        .send({ nextStatus: "searching" })
        .expect(200);

      expect(legalRes.body.status).toBe("searching");
    });
  });

  describe("T1.13: Quote expiry after 15 minutes", () => {
    it("expires quote after 15 minutes and rejects booking creation", async () => {
      vi.useFakeTimers();
      const baseTime = new Date("2026-10-11T10:00:00.000Z");
      vi.setSystemTime(baseTime);

      const quoteRes = await request(app)
        .post("/quotes")
        .send({
          pickup: { label: "Pollachi Town", lat: 10.658, lng: 77.008 },
          drop: { label: "Coimbatore Airport", lat: 11.029, lng: 77.043 },
          vehicleClass: "sedan",
          mode: "one_way",
        });

      const quoteId = quoteRes.body.id;

      // 14 minutes later: still valid
      vi.setSystemTime(new Date(baseTime.getTime() + 14 * 60 * 1000));
      const validCheck = await request(app)
        .post("/bookings")
        .send({ quoteId, paymentOption: "deposit" })
        .expect(201);
      expect(validCheck.body.id).toBeDefined();

      // Advance clock past 15 minutes (15 min + 10 sec)
      vi.setSystemTime(new Date(baseTime.getTime() + 15 * 60 * 1000 + 10000));

      const expiredRes = await request(app)
        .post("/bookings")
        .send({ quoteId, paymentOption: "deposit" })
        .expect(400);

      expect(expiredRes.body.code).toBe("QUOTE_EXPIRED");
      expect(expiredRes.body.message).toContain("Quote has expired");
    });
  });
});
