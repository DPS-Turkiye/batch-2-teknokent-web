import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { LtiLaunchError } from "@/interfaces/office-hours";
import { LtiRequestError } from "@/lib/api/lti";
import { ltiErrorFor, ltiErrorPath } from "@/lib/lti";

// 303 so the browser follows Moodle's form POST with a GET.
export function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export function ltiRefusalResponse(request: NextRequest, status: number) {
  return redirectTo(request, ltiErrorPath(ltiErrorFor(status)));
}

/**
 * A malformed form only comes from a Moodle set up wrong, so whoever configures it gets the exact field back as a
 * 400. Anything else is on our side and the person lands on the error page.
 */
export function ltiFailureResponse(request: NextRequest, error: unknown) {
  if (error instanceof LtiRequestError) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", message: error.message },
      { status: 400 },
    );
  }
  return redirectTo(request, ltiErrorPath(LtiLaunchError.Unavailable));
}
