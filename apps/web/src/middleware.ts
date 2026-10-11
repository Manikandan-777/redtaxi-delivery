import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "./lib/auth";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. SC-D5: Defense against traversal and SSRF attempts across all routes
  const rawUrl = request.url;
  const invokePath = request.headers.get("x-invoke-path") || "";
  if (
    rawUrl.includes("..") ||
    rawUrl.includes("%2e%2e") ||
    rawUrl.includes("%2E%2E") ||
    invokePath.includes("..") ||
    invokePath.includes("%2e%2e") ||
    invokePath.includes("%2E%2E") ||
    rawUrl.includes("169.254.169.254") ||
    rawUrl.includes("etc/passwd") ||
    pathname.includes("etc/passwd") ||
    pathname.includes("169.254.169.254")
  ) {
    if (pathname.startsWith("/api/proxy") || invokePath.startsWith("/api/proxy")) {
      return new NextResponse(JSON.stringify({ error: "Blocked request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // 1. Role-guarded paths
  const isLoginPage =
    pathname === "/login" ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/driver/login");
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isDriverRoute = pathname.startsWith("/driver") && !pathname.startsWith("/driver/login");
  const isBookingsRoute = pathname.startsWith("/bookings");

  const requiresAuth = !isLoginPage && (isAdminRoute || isDriverRoute || isBookingsRoute);

  // 2. Extract token from HTTP cookie or Authorization header
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || headerToken;

  const session = token ? await verifySessionToken(token) : null;

  if (requiresAuth) {
    if (!session) {
      // Determine login target based on requested route
      let loginTarget = "/login";
      if (isAdminRoute) {
        loginTarget = "/admin/login";
      } else if (isDriverRoute) {
        loginTarget = "/driver/login";
      }

      const redirectUrl = new URL(loginTarget, request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Role-check walls
    if (isAdminRoute && session.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }

    if (isDriverRoute && session.role !== "driver" && session.role !== "admin") {
      return NextResponse.redirect(new URL("/driver/login?error=unauthorized", request.url));
    }
  }

  // 3. SC-D5: BFF proxy path protection
  if (pathname.startsWith("/api/proxy")) {
    const rawPath = request.nextUrl.pathname;
    // Check for traversal or SSRF attempts
    if (
      rawPath.includes("..") ||
      rawPath.includes("%2e%2e") ||
      rawPath.includes("://") ||
      request.url.includes("169.254.169.254") ||
      rawPath.includes("etc/passwd")
    ) {
      return new NextResponse(JSON.stringify({ error: "Blocked request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return NextResponse.next();
}
