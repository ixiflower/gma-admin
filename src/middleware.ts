import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const session = request.cookies.get("gma_session")?.value;
  const { pathname } = request.nextUrl;

  if (!session && !AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\.(?:png|svg|jpg|ico|css|js|woff2?)).*)"],
};
