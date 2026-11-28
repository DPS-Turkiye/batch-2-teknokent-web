import { NextResponse, type NextRequest } from "next/server";

import { getPublicBackendUrl } from "@/lib/const";

/**
 * Moodle's LTI login initiation, at the URL Moodle is set up with. The backend does the work: the browser is sent
 * on to it unchanged (307 keeps a form POST a POST, with its body), so no server here holds a credential for it.
 */
function toBackend(request: NextRequest) {
  const target = new URL("/api/lti/login", getPublicBackendUrl());
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 307);
}

export const GET = toBackend;
export const POST = toBackend;
