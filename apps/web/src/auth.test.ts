import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  sanitizeRedirect,
  AUTH_COOKIE_NAME,
} from "./lib/auth";

describe("Web Auth Utility & Security Tests (Phase 3)", () => {
  describe("createSessionToken & verifySessionToken", () => {
    it("creates and verifies a valid passenger session token", async () => {
      const token = await createSessionToken({
        sub: "usr_1001",
        phone: "9876543210",
        role: "passenger",
        name: "Test Passenger",
      });

      expect(token).toBeDefined();
      const session = await verifySessionToken(token);
      expect(session).not.toBeNull();
      expect(session?.sub).toBe("usr_1001");
      expect(session?.phone).toBe("9876543210");
      expect(session?.role).toBe("passenger");
      expect(session?.name).toBe("Test Passenger");
    });

    it("creates and verifies an admin session token with rememberMe", async () => {
      const token = await createSessionToken(
        {
          sub: "admin_01",
          email: "admin@redtaxi.internal",
          role: "admin",
          name: "Super Admin",
        },
        true
      );

      const session = await verifySessionToken(token);
      expect(session).not.toBeNull();
      expect(session?.sub).toBe("admin_01");
      expect(session?.role).toBe("admin");
      expect(session?.email).toBe("admin@redtaxi.internal");
    });

    it("rejects tampered or malformed tokens", async () => {
      const invalid = "invalid.token.string";
      const session = await verifySessionToken(invalid);
      expect(session).toBeNull();
    });
  });

  describe("VR-1: Open Redirect Prevention (sanitizeRedirect)", () => {
    it("allows relative safe paths", () => {
      expect(sanitizeRedirect("/admin/stats")).toBe("/admin/stats");
      expect(sanitizeRedirect("/bookings")).toBe("/bookings");
      expect(sanitizeRedirect("/driver?tab=earnings")).toBe("/driver?tab=earnings");
    });

    it("blocks absolute URLs and falls back to safe path", () => {
      expect(sanitizeRedirect("https://evil.com/phish")).toBe("/");
      expect(sanitizeRedirect("http://evil.com")).toBe("/");
    });

    it("blocks protocol-relative URLs (//evil.com)", () => {
      expect(sanitizeRedirect("//evil.com/hack")).toBe("/");
      expect(sanitizeRedirect("//evil.com")).toBe("/");
    });

    it("blocks URLs with backslashes or encoded slashes", () => {
      expect(sanitizeRedirect("/\\evil.com")).toBe("/");
      expect(sanitizeRedirect("\\evil.com")).toBe("/");
    });

    it("blocks control characters or CRLF injection", () => {
      expect(sanitizeRedirect("/admin\r\nSet-Cookie:bad=1")).toBe("/");
    });

    it("falls back to custom fallback if provided", () => {
      expect(sanitizeRedirect("http://evil.com", "/dashboard")).toBe("/dashboard");
    });
  });

  describe("Cookie constants", () => {
    it("defines secure cookie name", () => {
      expect(AUTH_COOKIE_NAME).toBe("redtaxi_token");
    });
  });
});
