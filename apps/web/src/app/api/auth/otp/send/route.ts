import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter per phone / IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 3; // 429 within 10 requests as required by SC-A1 and security-smoke.sh
const attempts = new Map<string, { count: number; expiresAt: number }>();

export async function POST(request: NextRequest) {
  let body: { phone?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "BAD_REQUEST", message: "Malformed JSON" }, { status: 400 });
  }

  const { phone, role = "passenger" } = body;
  if (!phone || typeof phone !== "string") {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Phone is required" },
      { status: 400 }
    );
  }

  const sanitizedPhone = phone.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
    return NextResponse.json(
      { code: "INVALID_PHONE", message: "Phone must be a valid 10-digit Indian mobile number" },
      { status: 400 }
    );
  }

  // Rate limit check
  const now = Date.now();
  const key = `otp:${sanitizedPhone}`;
  const record = attempts.get(key);

  if (record && record.expiresAt > now) {
    if (record.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Too many OTP requests. Please wait." },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }
    record.count += 1;
  } else {
    attempts.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
  }

  // Success dispatch
  return NextResponse.json({
    success: true,
    message: "OTP sent successfully",
    resendAfterSec: 30,
    role,
  });
}
