import { NextResponse, type NextRequest } from "next/server";

import { createMeetingTodo, fetchMeetingTodos } from "@/lib/api/meeting-notes";
import { createMeetingTodoBodySchema } from "@/lib/notes-schemas";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ meetingId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { meetingId } = await context.params;
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchMeetingTodos(meetingId, organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting todo service is unavailable.",
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { meetingId } = await context.params;
    const body = createMeetingTodoBodySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "title is required." },
        { status: 400 },
      );
    }

    const session = await getSessionIds();
    return backendResponse(
      await createMeetingTodo(meetingId, session, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting todo could not be created.",
    });
  }
}
