import { NextResponse, type NextRequest } from "next/server";

import { LtiLaunchError } from "@/interfaces/office-hours";
import { startLtiLogin } from "@/lib/api/lti";
import { ltiErrorFor, ltiErrorPath } from "@/lib/lti";

/**
 * LTI 1.3 step one: Moodle sends the browser here (GET or form POST) to start a launch. The backend makes a
 * single-use state and nonce, and the browser goes on to Moodle's authorization endpoint with them.
 */
async function initiate(request: NextRequest, params: URLSearchParams) {
  const issuer = params.get("iss");
  const loginHint = params.get("login_hint");
  const targetLinkUri = params.get("target_link_uri");
  if (!issuer || !loginHint || !targetLinkUri) {
    return redirectTo(request, ltiErrorPath(LtiLaunchError.Rejected));
  }
  try {
    const response = await startLtiLogin({
      issuer,
      loginHint,
      targetLinkUri,
      ltiMessageHint: params.get("lti_message_hint") ?? undefined,
      clientId: params.get("client_id") ?? undefined,
      deploymentId: params.get("lti_deployment_id") ?? undefined,
    });
    if (response.status !== 200 || !response.data?.redirectUrl) {
      return redirectTo(request, ltiErrorPath(ltiErrorFor(response.status)));
    }
    return NextResponse.redirect(response.data.redirectUrl, 302);
  } catch {
    return redirectTo(request, ltiErrorPath(LtiLaunchError.Unavailable));
  }
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function GET(request: NextRequest) {
  return initiate(request, request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of form) {
    if (typeof value === "string") params.set(key, value);
  }
  return initiate(request, params);
}
