import { NextResponse, type NextRequest } from "next/server";

import {
  isOfficeHoursCoursePath,
  officeHoursCourseRequest,
} from "@/lib/api/lti";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

type Params = { params: Promise<{ courseId: string; path: string[] }> };

/** Office-hours booking in a course for the signed-in person: academics, slots, requests and meetings. */
export async function GET(_request: NextRequest, { params }: Params) {
  return forward(params, "GET");
}

export async function POST(request: NextRequest, { params }: Params) {
  const body = await request.text();
  return forward(params, "POST", body ? JSON.parse(body) : undefined);
}

async function forward(
  params: Params["params"],
  method: "GET" | "POST",
  data?: unknown,
) {
  const user = await getOfficeHoursUser();
  if (!user) {
    return NextResponse.json(
      { code: "SESSION_REQUIRED", message: await apiText("sessionMissing") },
      { status: 401 },
    );
  }
  const { courseId, path } = await params;
  const joined = path.join("/");
  if (!isOfficeHoursCoursePath(joined)) {
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  }
  try {
    return backendResponse(
      await officeHoursCourseRequest(
        user.userId,
        courseId,
        joined,
        method,
        data,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("officeHoursFailed"),
    });
  }
}
