import type { NextRequest } from "next/server";
import { z } from "zod";

import { UserRole } from "@/interfaces/session";
import { clearMeetingNoShow, markMeetingNoShow } from "@/lib/api/meetings";
import { MENTOR_NO_SHOW_NOTE_MAX_LENGTH } from "@/lib/const/mentor-evaluation";
import { hasPermission } from "@/lib/permissions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const noShowSchema = z.object({
  note: z.string().max(MENTOR_NO_SHOW_NOTE_MAX_LENGTH).default(""),
});

async function forbidden() {
  return Response.json(
    { code: "FORBIDDEN", message: await apiText("onlyMentorMarksNoShow") },
    { status: 403 },
  );
}

async function sessionMentorId() {
  const session = await getSessionUser();
  return session && hasPermission(session, UserRole.Mentor)
    ? session.userId
    : null;
}

/** The backend checks the meeting is this mentor's; the mentor id only ever comes from the session. */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const mentorId = await sessionMentorId();
    if (!mentorId) return await forbidden();
    const body = await readJsonBody(request, noShowSchema);
    if (!body.ok) return body.response;
    const { id } = await context.params;
    return backendResponse(
      await markMeetingNoShow(id, mentorId, body.data.note),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingNoShowFailed"),
    });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const mentorId = await sessionMentorId();
    if (!mentorId) return await forbidden();
    const { id } = await context.params;
    return backendResponse(await clearMeetingNoShow(id, mentorId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingNoShowFailed"),
    });
  }
}
