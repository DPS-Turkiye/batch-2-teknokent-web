import { unsealData } from "iron-session";
import { NextResponse, type NextRequest } from "next/server";

import type { AppSession, SessionData } from "@/interfaces/session";
import {
  hasMobileApp,
  isMobilePath,
  isPhoneUserAgent,
  MOBILE_HOME,
  MOBILE_LOGIN,
  PHONE_ENTRY_PATHS,
  PREFER_WEB_COOKIE,
  PREFER_WEB_PARAM,
} from "@/lib/mobile";
import {
  currentSessionUser,
  isPublicPath,
  loginPathFor,
  safeNextPath,
  SESSION_COOKIE,
} from "@/lib/public-paths";

/** Signing in again while already signed in is never what the visitor wants. */
const SIGNED_OUT_ONLY_PATHS = new Set(["/login", "/signup", MOBILE_LOGIN]);

const PREFER_WEB_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type SessionRead = { signedIn: boolean; user?: AppSession };

/**
 * Only a page load the visitor made may switch a phone to the web pages. Next.js
 * prefetches with fetch() (Sec-Fetch-Dest: empty) and deletes its own prefetch
 * headers before the proxy runs, so they cannot be checked here. Browsers that
 * send no Sec-Fetch-Dest are treated as page loads.
 */
function isPageLoad(request: NextRequest) {
  return (request.headers.get("sec-fetch-dest") ?? "document") === "document";
}

/**
 * A cookie that is merely present is not a session: an expired one, or one
 * sealed with a rotated password, unseals to nothing. Treating it as signed in
 * rendered the app to a stranger as "Kullanıcı", and sent them away from /login.
 * The account re-check is left to getSessionUser: a backend call per page load
 * is too costly, and every page fetches /api/session and its data through it.
 */
async function readSession(seal: string | undefined): Promise<SessionRead> {
  if (!seal) return { signedIn: false };
  const password = process.env.SESSION_PASSWORD;
  // Without the password this cannot tell; the pages still ask /api/session.
  if (!password) return { signedIn: true };
  try {
    const user = currentSessionUser(
      await unsealData<SessionData>(seal, { password }),
    );
    return user ? { signedIn: true, user } : { signedIn: false };
  } catch {
    return { signedIn: false };
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const seal = request.cookies.get(SESSION_COOKIE)?.value;
  const { signedIn, user } = await readSession(seal);
  const mobile = isMobilePath(pathname);
  const asksForWeb = searchParams.get(PREFER_WEB_PARAM) === "1";
  const savesWebChoice = asksForWeb && isPageLoad(request);
  const prefersWeb =
    asksForWeb || request.cookies.get(PREFER_WEB_COOKIE)?.value === "1";

  const respond = (response: NextResponse) => {
    if (seal && !signedIn) response.cookies.delete(SESSION_COOKIE);
    if (savesWebChoice) {
      response.cookies.set(PREFER_WEB_COOKIE, "1", {
        path: "/",
        sameSite: "lax",
        maxAge: PREFER_WEB_MAX_AGE_SECONDS,
      });
    } else if (mobile) {
      response.cookies.delete(PREFER_WEB_COOKIE);
    }
    return response;
  };
  const redirect = (path: string) =>
    respond(NextResponse.redirect(new URL(path, request.url)));

  const phoneUser = !user || hasMobileApp(user.role);
  if (
    PHONE_ENTRY_PATHS.has(pathname) &&
    !prefersWeb &&
    phoneUser &&
    isPhoneUserAgent(request.headers.get("user-agent"))
  ) {
    return redirect(signedIn ? MOBILE_HOME : MOBILE_LOGIN);
  }

  if (signedIn && SIGNED_OUT_ONLY_PATHS.has(pathname)) {
    // /workspace resolves the role and forwards on, so the destination need not
    // be worked out here.
    const next = safeNextPath(searchParams.get("next"));
    return redirect(next ?? (mobile ? MOBILE_HOME : "/workspace"));
  }

  if (isPublicPath(pathname)) {
    return respond(NextResponse.next());
  }

  if (!signedIn) {
    return redirect(loginPathFor(pathname));
  }

  if (mobile && !phoneUser) {
    return redirect(`/workspace?${PREFER_WEB_PARAM}=1`);
  }

  return respond(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)"],
};
