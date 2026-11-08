import { NextResponse, type NextRequest } from "next/server";

import { startLtiLogin, type LtiForm } from "@/lib/api/lti";
import {
  ltiFailureResponse,
  ltiRefusalResponse,
} from "@/lib/server/lti-response";

// Moodle may start a launch with a GET or a form POST, so both read the same fields.
async function initiate(request: NextRequest, form: LtiForm) {
  try {
    const response = await startLtiLogin(form);
    if (response.status !== 200 || !response.data?.redirectUrl) {
      return ltiRefusalResponse(request, response.status);
    }
    return NextResponse.redirect(response.data.redirectUrl, 302);
  } catch (error) {
    return ltiFailureResponse(request, error);
  }
}

export async function GET(request: NextRequest) {
  return initiate(request, Object.fromEntries(request.nextUrl.searchParams));
}

export async function POST(request: NextRequest) {
  return initiate(request, Object.fromEntries(await request.formData()));
}
