import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; rememberMe?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "BAD_REQUEST", message: "Malformed JSON" }, { status: 400 });
  }

  const { email, password, rememberMe = false } = body;
  if (!email || !password) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Email and password are required" },
      { status: 400 }
    );
  }

  // Demo admin credentials check
  if (email !== "admin@redtaxi.internal" || password !== "AdminPass123!") {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Admin requires MFA per DEC-14
  return NextResponse.json({
    mfaRequired: true,
    message: "TOTP MFA code required",
    email,
    rememberMe,
  });
}
