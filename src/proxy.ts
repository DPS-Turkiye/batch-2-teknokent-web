import { unsealData } from "iron-session";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { SessionData } from "@/interfaces/session";
import { isPublicPath, SESSION_COOKIE } from "@/lib/public-paths";

/** Signing in again while already signed in is never what the visitor wants. */
const SIGNED_OUT_ONLY_PATHS = new Set(["/login", "/signup"]);

/**
 * Only ever an in-app path. An absolute URL, or a protocol-relative "//host",
 * would turn this into an open redirect.
 */
function safeNextPath(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/**
 * A cookie that is merely present is not a session: an expired one, or one
 * sealed with a rotated password, unseals to nothing. Treating it as signed in
 * rendered the app to a stranger as "Kullanıcı", and sent them away from /login.
 */
async function hasSession(seal: string | undefined) {
  if (!seal) return false;
  const password = process.env.SESSION_PASSWORD;
  // Without the password this cannot tell; the pages still ask /api/session.
  if (!password) return true;
  try {
    const data = await unsealData<SessionData>(seal, { password });
    return Boolean(data.user);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const seal = request.cookies.get(SESSION_COOKIE)?.value;
  const signedIn = await hasSession(seal);
  const respond = (response: NextResponse) => {
    if (seal && !signedIn) response.cookies.delete(SESSION_COOKIE);
    return response;
  };

  if (signedIn && SIGNED_OUT_ONLY_PATHS.has(pathname)) {
    // /workspace resolves the role and forwards on, so the destination need not
    // be worked out here.
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next ?? "/workspace", request.url));
  }

  if (isPublicPath(pathname)) {
    return respond(NextResponse.next());
  }

  if (!signedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return respond(NextResponse.redirect(login));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
