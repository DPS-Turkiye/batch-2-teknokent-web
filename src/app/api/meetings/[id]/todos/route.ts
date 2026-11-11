import type { NextRequest } from "next/server";

import { createMeetingTodo, fetchMeetingTodos } from "@/lib/api/meeting-notes";
import { createMeetingTodoBodySchema } from "@/lib/notes-schemas";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchMeetingTodos(id, organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingTaskServiceUnavailable"),
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request, createMeetingTodoBodySchema, {
      invalidMessage: "taskTitleRequired",
    });
    if (!body.ok) return body.response;

    const session = await getSessionIds();
    return backendResponse(await createMeetingTodo(id, session, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingTaskCreateFailed"),
    });
  }
}
