import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { UserRole } from "@/interfaces/session";
import { fetchTaskAssignees } from "@/lib/api/mentor-task-assignment";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const t = await getTranslations("mentorHome.assignTask");
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    if (!hasPermission(session, UserRole.Mentor)) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: t("forbidden") },
        { status: 403 },
      );
    }
    const { id } = await params;
    return backendResponse(await fetchTaskAssignees(id, session.userId));
  } catch (error) {
    return apiErrorResponse(error, { message: t("loadFailed") });
  }
}
