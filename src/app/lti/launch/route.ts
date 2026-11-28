import { NextResponse } from "next/server";

import { getPublicBackendUrl } from "@/lib/const";

/**
 * Moodle's LTI launch, at the URL Moodle is set up with. The browser re-posts the same form to the backend
 * (307), which verifies the launch, sets its own office-hours session cookie and sends it on to the course.
 */
export function POST() {
  return NextResponse.redirect(
    new URL("/api/lti/launch", getPublicBackendUrl()),
    307,
  );
}
