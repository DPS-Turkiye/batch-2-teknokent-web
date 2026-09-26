import { NextResponse, type NextRequest } from "next/server";

import { mobileTargetFor } from "@/lib/mobile-notifications";

/** Where a tapped push notification lands; the proxy sends signed-out phones to login first. */
export function GET(request: NextRequest) {
  const target = mobileTargetFor(request.nextUrl.searchParams.get("category"));
  return NextResponse.redirect(new URL(target, request.url));
}
