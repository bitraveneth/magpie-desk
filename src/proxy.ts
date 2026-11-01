import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath, sessionCookieName, sessionValid } from "@/lib/auth";

const publicPaths = [/^\/login$/, /^\/r(?:\/|$)/, /^\/p(?:\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = sessionValid(request.cookies.get(sessionCookieName)?.value);

  if (publicPaths.some((pattern) => pattern.test(pathname))) {
    if (pathname === "/login" && signedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (signedIn) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  const next = `${pathname}${search}`;
  if (safeNextPath(next) !== "/") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|.*\\.(?:png|ico|woff2)$).*)"],
};
