import { NextResponse, type NextRequest } from "next/server";

import { LtiLaunchError } from "@/interfaces/office-hours";
import { completeLtiLaunch } from "@/lib/api/lti";
import { ltiErrorFor, ltiErrorPath, officeHoursCoursePath } from "@/lib/lti";
import { saveOfficeHoursUser } from "@/lib/server/office-hours-session";

/**
 * LTI 1.3 step two: Moodle posts the signed id_token and our state here. The backend verifies them and records
 * who came from which course; the launch is the sign-in, so the person gets an office-hours session and lands
 * on that course.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const idToken = form.get("id_token");
  const state = form.get("state");
  if (typeof idToken !== "string" || typeof state !== "string") {
    return redirectTo(request, ltiErrorPath(LtiLaunchError.Rejected));
  }
  try {
    const response = await completeLtiLaunch(idToken, state);
    if (response.status !== 200) {
      return redirectTo(request, ltiErrorPath(ltiErrorFor(response.status)));
    }
    const launch = response.data;
    await saveOfficeHoursUser({
      userId: launch.userId,
      fullName: launch.fullName,
    });
    return redirectTo(request, officeHoursCoursePath(launch.courseId));
  } catch {
    return redirectTo(request, ltiErrorPath(LtiLaunchError.Unavailable));
  }
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}
