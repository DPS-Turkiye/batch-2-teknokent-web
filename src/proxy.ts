import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/invite",
  "/application-status",
]);

/** Signing in again while already signed in is never what the visitor wants. */
const SIGNED_OUT_ONLY_PATHS = new Set(["/login", "/signup"]);

/**
 * Only ever an in-app path. An absolute URL, or a protocol-relative "//host",
 * would turn this into an open redirect.
 */
function safeNextPath(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("teknokent_session");

  if (hasSession && SIGNED_OUT_ONLY_PATHS.has(pathname)) {
    // /workspace resolves the role and forwards on, so the destination need not
    // be worked out here — the session cookie is encrypted and unreadable anyway.
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next ?? "/workspace", request.url));
  }

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/invite")) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
