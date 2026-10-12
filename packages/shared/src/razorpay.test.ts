import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from "./razorpay.js";

describe("Phase 8: Razorpay Signature Verification Utilities (T8.3 / SC-C2 / SC-C3)", () => {
  const secret = "test_key_for_hmac_testing";
  const orderId = "order_123456789";
  const paymentId = "pay_987654321";

  it("successfully verifies authentic Razorpay payment signature", () => {
    const validSignature = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: validSignature,
      secret,
    });

    expect(isValid).toBe(true);
  });

  it("rejects forged / altered payment signature", () => {
    const isBad = verifyRazorpaySignature({
      orderId,
      paymentId,
      signature: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      secret,
    });

    expect(isBad).toBe(false);
  });

  it("rejects empty or missing parameters safely without throwing", () => {
    expect(
      verifyRazorpaySignature({
        orderId: "",
        paymentId,
        signature: "sig",
        secret,
      })
    ).toBe(false);

    expect(
      verifyRazorpaySignature({
        orderId,
        paymentId: "",
        signature: "sig",
        secret,
      })
    ).toBe(false);

    expect(
      verifyRazorpaySignature({
        orderId,
        paymentId,
        signature: "",
        secret,
      })
    ).toBe(false);
  });

  it("successfully verifies authentic webhook payload signature", () => {
    const rawBody = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: 50000 } } },
    });

    const validWebhookSig = createHmac("sha256", secret).update(rawBody).digest("hex");

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature: validWebhookSig,
      secret,
    });

    expect(isValid).toBe(true);
  });

  it("rejects tampered webhook payload body", () => {
    const rawBody = JSON.stringify({ event: "payment.captured", amount: 50000 });
    const validWebhookSig = createHmac("sha256", secret).update(rawBody).digest("hex");

    const tamperedBody = JSON.stringify({ event: "payment.captured", amount: 100 });

    const isTamperedValid = verifyRazorpayWebhookSignature({
      rawBody: tamperedBody,
      signature: validWebhookSig,
      secret,
    });

    expect(isTamperedValid).toBe(false);
  });
});
