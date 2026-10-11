import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; totpCode?: string; rememberMe?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "BAD_REQUEST", message: "Malformed JSON" }, { status: 400 });
  }

  const { email, totpCode, rememberMe = false } = body;
  if (!email || !totpCode) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Email and TOTP code are required" },
      { status: 400 }
    );
  }

  // Verify TOTP code (demo code 123456 or 654321 accepted)
  if (!/^\d{6}$/.test(totpCode) || (totpCode !== "123456" && totpCode !== "654321")) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid MFA verification code" },
      { status: 401 }
    );
  }

  const token = await createSessionToken(
    {
      sub: "admin-master",
      email,
      role: "admin",
      name: "Super Admin",
    },
    rememberMe
  );

  const response = NextResponse.json({
    token,
    user: {
      id: "admin-master",
      email,
      role: "admin",
      name: "Super Admin",
    },
  });

  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60; // 30 days vs 8 hours

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
