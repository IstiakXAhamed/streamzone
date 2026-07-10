import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware for performance.
 *
 * 1. Fast auth-gate: Redirects unauthenticated users away from protected routes
 *    at the edge (CDN layer) without needing a full server render.
 * 2. Security headers for all responses.
 *
 * This checks the JWT cookie existence (NOT validity — that's done in the
 * layouts). The goal is to fail fast for obvious non-auth requests.
 */

// Protected route prefixes that require a session cookie
const PROTECTED_PREFIXES = ["/watch", "/party", "/downloads", "/friends", "/profile", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    // Look for the session token cookie (production vs dev naming)
    const hasSession =
      req.cookies.has("__Secure-next-auth.session-token") ||
      req.cookies.has("next-auth.session-token");

    if (!hasSession) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add performance and security headers
  const response = NextResponse.next();

  // Prevent slow DNS lookups by pre-connecting to known external origins
  response.headers.set(
    "Link",
    [
      "<https://lh3.googleusercontent.com>; rel=preconnect",
      "<https://www.googleapis.com>; rel=preconnect",
    ].join(", "),
  );

  return response;
}

export const config = {
  // Only run on page routes, skip API/static/image routes for performance
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest).*)",
  ],
};
