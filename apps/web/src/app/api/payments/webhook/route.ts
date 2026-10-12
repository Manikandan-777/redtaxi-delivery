import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@redtaxi/shared";

// In-memory processed webhook event ID store for replay idempotency (T8.3)
const processedWebhookEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Missing x-razorpay-signature header" },
        { status: 401 }
      );
    }

    const rawBody = await req.text();
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_SECRET_KEY ||
      "mock_razorpay_secret_key_testing";

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      secret: webhookSecret,
    });

    if (!isValid) {
      return NextResponse.json(
        { code: "INVALID_SIGNATURE", message: "Razorpay webhook signature verification failed" },
        { status: 400 }
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Malformed JSON payload" },
        { status: 400 }
      );
    }

    const eventId =
      (payload.event_id as string) ||
      (payload.id as string) ||
      `${payload.event}_${(payload.payload as Record<string, unknown>)?.payment ? ((payload.payload as Record<string, unknown>).payment as Record<string, unknown> & { entity: { id: string } }).entity?.id : "unknown"}`;

    // Replay idempotency test (T8.3 / SC-C3: replay twice -> one state change)
    if (processedWebhookEvents.has(eventId)) {
      return NextResponse.json({
        received: true,
        replayed: true,
        message: "Webhook event already processed (idempotent ignore)",
      });
    }

    processedWebhookEvents.add(eventId);

    // Forward to internal backend / ledger if configured
    const internalUrl = process.env.API_INTERNAL_URL || "http://localhost:4000";
    try {
      await fetch(`${internalUrl}/payments/webhook-internal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Mock / offline fallback safe
    }

    return NextResponse.json({
      received: true,
      processed: true,
      eventId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
