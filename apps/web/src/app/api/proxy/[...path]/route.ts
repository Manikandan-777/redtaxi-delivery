import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path || [];
  const fullPath = pathParts.join("/");

  // SC-D5: Defense-in-depth against path traversal and SSRF
  if (
    fullPath.includes("..") ||
    fullPath.includes("etc/passwd") ||
    fullPath.includes("169.254.169.254") ||
    request.url.includes("%2e%2e") ||
    request.url.includes("meta-data")
  ) {
    return NextResponse.json({ error: "Blocked path traversal / SSRF" }, { status: 400 });
  }

  return NextResponse.json({
    proxy: true,
    path: fullPath,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path || [];
  const fullPath = pathParts.join("/");

  if (
    fullPath.includes("..") ||
    fullPath.includes("etc/passwd") ||
    fullPath.includes("169.254.169.254") ||
    request.url.includes("%2e%2e") ||
    request.url.includes("meta-data")
  ) {
    return NextResponse.json({ error: "Blocked path traversal / SSRF" }, { status: 400 });
  }

  return NextResponse.json({
    proxy: true,
    path: fullPath,
  });
}
