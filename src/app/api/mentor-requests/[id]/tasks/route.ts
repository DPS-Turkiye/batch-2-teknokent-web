import { getTranslations } from "next-intl/server";
import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { assignMentorshipTask } from "@/lib/api/mentor-task-assignment";
import { assignMentorshipTaskSchema } from "@/lib/mentor-task-assignment";
import { hasPermission } from "@/lib/permissions";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function POST(
  request: NextRequest,
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
    const parsed = assignMentorshipTaskSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: t("validation") },
        { status: 400 },
      );
    }
    const { id } = await params;
    return backendResponse(
      await assignMentorshipTask(id, session.userId, parsed.data),
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: t("validation") },
        { status: 400 },
      );
    }
    return apiErrorResponse(error, { message: t("saveFailed") });
  }
}
