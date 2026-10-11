import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { createSessionToken, AUTH_COOKIE_NAME } from "./lib/auth";

describe("T3.1 & SC-B1 & SC-D5: Auth Middleware & Role Walls E2E", () => {
  const baseUrl = "http://localhost:3000";

  it("anonymous GET /admin redirects to /admin/login?next=/admin", async () => {
    const req = new NextRequest(new URL("/admin", baseUrl));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
    expect(location).toContain("next=%2Fadmin");
  });

  it("anonymous GET /driver redirects to /driver/login?next=/driver", async () => {
    const req = new NextRequest(new URL("/driver", baseUrl));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/driver/login");
    expect(location).toContain("next=%2Fdriver");
  });

  it("anonymous GET /bookings redirects to /login?next=/bookings", async () => {
    const req = new NextRequest(new URL("/bookings", baseUrl));
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("next=%2Fbookings");
  });

  it("passenger role cannot access /admin (redirects with unauthorized error)", async () => {
    const passengerToken = await createSessionToken({
      sub: "usr_pass",
      role: "passenger",
    });

    const req = new NextRequest(new URL("/admin", baseUrl), {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${passengerToken}`,
      },
    });

    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/admin/login?error=unauthorized");
  });

  it("admin role can access /admin route without redirect", async () => {
    const adminToken = await createSessionToken({
      sub: "usr_admin",
      role: "admin",
    });

    const req = new NextRequest(new URL("/admin", baseUrl), {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${adminToken}`,
      },
    });

    const res = await middleware(req);
    // NextResponse.next() returns a 200 with x-middleware-next header
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("driver role can access /driver route", async () => {
    const driverToken = await createSessionToken({
      sub: "usr_driver",
      role: "driver",
    });

    const req = new NextRequest(new URL("/driver", baseUrl), {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=${driverToken}`,
      },
    });

    const res = await middleware(req);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  describe("SC-D5: BFF proxy blocks traversal and SSRF attacks", () => {
    it("blocks directory traversal attempts in proxy route", async () => {
      const rawPath = "/api/proxy/../../admin/stats";
      const req = new NextRequest(new URL(rawPath, baseUrl), {
        headers: { "x-invoke-path": rawPath },
      });
      const res = await middleware(req);
      expect(res.status).toBe(400);
    });

    it("blocks URL encoded traversal %2e%2e", async () => {
      const rawPath = "/api/proxy/%2e%2e/%2e%2e/etc/passwd";
      const req = new NextRequest(new URL(rawPath, baseUrl), {
        headers: { "x-invoke-path": rawPath },
      });
      const res = await middleware(req);
      expect(res.status).toBe(400);
    });

    it("blocks AWS/cloud metadata SSRF IP 169.254.169.254", async () => {
      const req = new NextRequest(
        new URL("/api/proxy/http://169.254.169.254/latest/meta-data/", baseUrl)
      );
      const res = await middleware(req);
      expect(res.status).toBe(400);
    });
  });
});
