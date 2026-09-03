import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/jwt";

// `middleware.ts` was renamed to `proxy.ts` in Next.js 16 — same behaviour,
// new file and export name.

/**
 * Endpoints that authenticate themselves and must stay reachable without a
 * session cookie: login, first-run seeding and the cron job (secret-guarded).
 */
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/seed",
  "/api/cron",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const session = await verifyToken(request.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated. Sign in again to continue." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/data/:path*",
    "/api/bootstrap",
    "/api/activity",
    "/api/backup",
    "/api/backup/:path*",
    "/api/exchange-rates",
  ],
};
