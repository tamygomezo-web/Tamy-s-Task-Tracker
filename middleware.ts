import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, getSessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page and login API through
  if (pathname === "/login" || pathname === "/api/login") {
    return NextResponse.next();
  }

  // Allow Vercel cron to call GET /api/email/summary without a session cookie
  if (pathname === "/api/email/summary" && req.method === "GET") {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  const expected = await getSessionToken();

  if (session !== expected) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
