import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const publicPaths = ["/login", "/api/auth/login", "/api/auth/seed"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session for dashboard routes and API routes
  if (pathname.startsWith("/api/") || pathname === "/" || pathname.startsWith("/dashboard")) {
    const session = await getIronSession<{ userId?: string }>(request, NextResponse.next(), {
      password: process.env.SESSION_PASSWORD!,
      cookieName: "ij_dash_session",
    });

    if (!session.userId) {
      // API routes return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Pages redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
