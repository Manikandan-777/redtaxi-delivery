import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { POST as webhookPost } from "./app/api/payments/webhook/route";
import { POST as reconcilePost } from "./app/api/payments/reconcile/route";
import { NextRequest } from "next/server";
import { NotificationTemplates, formatIST } from "@redtaxi/shared";

describe("Phase 8: Real Backend Integration Unit & Contract Tests (T8.3, T8.4, T8.5, T8.7)", () => {
  const secret = "mock_razorpay_secret_key_testing";

  describe("T8.3: Razorpay Webhook Signature Verification and Replay Idempotency", () => {
    it("accepts valid signed webhook payload", async () => {
      const payload = {
        event: "payment.captured",
        id: "evt_1001",
        payload: { payment: { entity: { id: "pay_1001", order_id: "order_1001", amount: 50000 } } },
      };
      const rawBody = JSON.stringify(payload);
      const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

      const req = new NextRequest("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "x-razorpay-signature": signature,
          "content-type": "application/json",
        },
        body: rawBody,
      });

      const res = await webhookPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
      expect(data.processed).toBe(true);
    });

    it("rejects forged webhook signature with 400", async () => {
      const payload = { event: "payment.captured", id: "evt_1002" };
      const rawBody = JSON.stringify(payload);

      const req = new NextRequest("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: {
          "x-razorpay-signature": "forged_signature_hex_value",
          "content-type": "application/json",
        },
        body: rawBody,
      });

      const res = await webhookPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe("INVALID_SIGNATURE");
    });

    it("idempotently handles replayed webhook event (replay twice -> single process)", async () => {
      const payload = {
        event: "payment.captured",
        id: "evt_replay_test",
        payload: {
          payment: { entity: { id: "pay_replay_test", order_id: "order_replay", amount: 50000 } },
        },
      };
      const rawBody = JSON.stringify(payload);
      const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

      // First call
      const req1 = new NextRequest("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: { "x-razorpay-signature": signature },
        body: rawBody,
      });
      const res1 = await webhookPost(req1);
      const data1 = await res1.json();
      expect(data1.processed).toBe(true);

      // Replay call
      const req2 = new NextRequest("http://localhost:3000/api/payments/webhook", {
        method: "POST",
        headers: { "x-razorpay-signature": signature },
        body: rawBody,
      });
      const res2 = await webhookPost(req2);
      const data2 = await res2.json();
      expect(data2.replayed).toBe(true);
      expect(data2.message).toContain("idempotent");
    });
  });

  describe("T8.4: Payment Reconciliation Job", () => {
    it("rejects unauthenticated trigger of reconciliation job", async () => {
      const req = new NextRequest("http://localhost:3000/api/payments/reconcile", {
        method: "POST",
      });
      const res = await reconcilePost(req);
      expect(res.status).toBe(401);
    });

    it("executes reconciliation job with authorized key and verifies 0 orphaned orders", async () => {
      const req = new NextRequest("http://localhost:3000/api/payments/reconcile", {
        method: "POST",
        headers: { "x-cron-key": "secret-cron-key" },
      });
      const res = await reconcilePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.report.orphanedOrders).toBe(0);
      expect(data.report.status).toBe("reconciled");
    });
  });

  describe("T8.5: Push Notification Templates", () => {
    it("generates correct Offer, Assignment, Arrival, and Completion notifications", () => {
      const offerNotif = NotificationTemplates.offer({
        bookingId: "bk_1",
        pickup: "Pollachi Bus Stand",
        earnings: "₹1,494",
      });
      expect(offerNotif.title).toContain("Offer");
      expect(offerNotif.data.type).toBe("offer");
      expect(offerNotif.priority).toBe("high");

      const assignNotif = NotificationTemplates.assignment({
        bookingId: "bk_1",
        driverName: "Karthik Raja",
        vehicleNo: "TN 41 AB 1234",
      });
      expect(assignNotif.body).toContain("Karthik Raja");
      expect(assignNotif.data.type).toBe("assignment");

      const arrivalNotif = NotificationTemplates.arrival({
        bookingId: "bk_1",
        driverName: "Karthik Raja",
        otp: "4321",
      });
      expect(arrivalNotif.body).toContain("4321");
      expect(arrivalNotif.data.type).toBe("arrival");

      const completeNotif = NotificationTemplates.completion({
        bookingId: "bk_1",
        amountCollected: "₹1,494",
      });
      expect(completeNotif.body).toContain("completed");
      expect(completeNotif.data.type).toBe("completion");
    });
  });

  describe("T8.7: IST Time Display and DST Immunity", () => {
    it("formats ISO timestamps strictly in Indian Standard Time (UTC+5:30) with no DST drift", () => {
      const winterDate = new Date("2026-01-15T10:00:00Z");
      const summerDate = new Date("2026-07-15T10:00:00Z");

      const winterFormatted = formatIST(winterDate);
      const summerFormatted = formatIST(summerDate);

      // Both must be exactly +5 hours 30 mins (3:30 pm)
      expect(winterFormatted.toLowerCase()).toContain("3:30 pm");
      expect(summerFormatted.toLowerCase()).toContain("3:30 pm");
    });
  });
});
