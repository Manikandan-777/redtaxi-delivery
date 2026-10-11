import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";
import type { Role } from "@redtaxi/shared";

export async function POST(request: NextRequest) {
  let body: { phone?: string; otp?: string; role?: Role };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "BAD_REQUEST", message: "Malformed JSON" }, { status: 400 });
  }

  const { phone, otp, role = "passenger" } = body;
  if (!phone || !otp) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Phone and OTP are required" },
      { status: 400 }
    );
  }

  const cleanPhone = phone.replace(/\D/g, "");
  // In demo / staging, standard 6-digit OTP is verified
  // Demo master OTP 123456 or test OTPs accepted
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { code: "INVALID_OTP", message: "OTP must be 6 digits" },
      { status: 400 }
    );
  }

  if (otp !== "123456" && otp !== "654321") {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Incorrect OTP entered" },
      { status: 401 }
    );
  }

  const userId = `usr_${cleanPhone.slice(-4)}`;
  const token = await createSessionToken({
    sub: userId,
    phone: cleanPhone,
    role,
    name: role === "driver" ? "RedTaxi Partner" : "RedTaxi Passenger",
  });

  const response = NextResponse.json({
    token,
    user: {
      id: userId,
      phone: cleanPhone,
      role,
    },
  });

  // Set secure HTTP-only cookie
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}
