import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Razorpay payment signature:
 * hmac_sha256(order_id + "|" + razorpay_payment_id, secret)
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  const { orderId, paymentId, signature, secret } = params;
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const generated = createHmac("sha256", secret).update(payload).digest("hex");

    const genBuf = Buffer.from(generated, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return timingSafeEqual(genBuf, sigBuf);
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay Webhook signature:
 * hmac_sha256(raw_body, webhook_secret)
 */
export function verifyRazorpayWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  const { rawBody, signature, secret } = params;
  if (!rawBody || !signature || !secret) {
    return false;
  }

  try {
    const generated = createHmac("sha256", secret).update(rawBody).digest("hex");
    const genBuf = Buffer.from(generated, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return timingSafeEqual(genBuf, sigBuf);
  } catch {
    return false;
  }
}
