import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@redtaxi/shared";

export interface SessionPayload {
  sub: string; // user id
  phone?: string | undefined;
  email?: string | undefined;
  role: Role;
  name?: string | undefined;
}

const DEFAULT_SECRET = "redtaxi-auth-jwt-secret-min-32-chars-key-2026";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export const AUTH_COOKIE_NAME = "redtaxi_token";

/**
 * Sign session JWT with standard expiration.
 * Driver / passenger: 30 days
 * Admin: 8 hours (or 30 days if rememberMe)
 */
export async function createSessionToken(
  payload: SessionPayload,
  rememberMe: boolean = false
): Promise<string> {
  const expiration = payload.role === "admin" ? (rememberMe ? "30d" : "8h") : "30d";

  return await new SignJWT({
    sub: payload.sub,
    phone: payload.phone,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(getSecretKey());
}

/**
 * Verify session JWT and return payload or null if invalid/expired.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.role) {
      return null;
    }
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      phone: payload.phone as string | undefined,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * VR-1: Sanitize and validate open redirect `next` parameter.
 * Only allows local relative paths, rejecting protocol-relative, absolute URLs, or control characters.
 */
export function sanitizeRedirect(
  nextUrl: string | null | undefined,
  fallback: string = "/"
): string {
  if (!nextUrl) return fallback;
  // Trim and check
  const trimmed = nextUrl.trim();
  // Must start with '/' and must NOT start with '//' (protocol-relative) or contain backslashes
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    // Ensure no control characters or CRLF (ASCII 0 to 31 or 127)
    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i);
      if ((code >= 0 && code <= 31) || code === 127) {
        return fallback;
      }
    }
    return trimmed;
  }
  return fallback;
}
