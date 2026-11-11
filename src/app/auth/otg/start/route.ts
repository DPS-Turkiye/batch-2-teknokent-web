import { NextRequest, NextResponse } from "next/server";

import { InstitutionProvider } from "@/interfaces/institution-login";
import { startInstitutionLogin } from "@/lib/api/institution-login";
import {
  isOtgLoginEnabled,
  OTG_FAILURE_PARAM,
  OtgLoginFailure,
} from "@/lib/otg-login";
import { safeNextPath } from "@/lib/public-paths";
import { rememberInstitutionLogin } from "@/lib/server/institution-login-cookie";

function backToLogin(request: NextRequest, next: string | null) {
  const login = new URL("/login", request.url);
  login.searchParams.set(OTG_FAILURE_PARAM, OtgLoginFailure.Failed);
  if (next) login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

/**
 * GET with no parameters, because OTG's own "Menton'a git" button opens it: the student is already signed in at
 * OTG, so they come back signed in here without typing anything. ?next= is kept only when it is an in-app path.
 */
export async function GET(request: NextRequest) {
  if (!isOtgLoginEnabled()) return new NextResponse(null, { status: 404 });
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  try {
    const started = await startInstitutionLogin(InstitutionProvider.Otg);
    const target = started.status === 200 ? started.data.redirectUrl : "";
    if (!target.startsWith("https://")) return backToLogin(request, next);
    return rememberInstitutionLogin(NextResponse.redirect(target), {
      provider: InstitutionProvider.Otg,
      state: started.data.state,
      next,
    });
  } catch {
    return backToLogin(request, next);
  }
}
