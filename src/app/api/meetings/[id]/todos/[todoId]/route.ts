import type { NextRequest } from "next/server";

import { deleteMeetingTodo, updateMeetingTodo } from "@/lib/api/meeting-notes";
import { updateMeetingTodoBodySchema } from "@/lib/notes-schemas";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string; todoId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, todoId } = await context.params;
    const body = await readJsonBody(request, updateMeetingTodoBodySchema, {
      invalidMessage: "taskTitleOrDoneRequired",
    });
    if (!body.ok) return body.response;

    const { organizationId } = await getSessionIds();
    return backendResponse(
      await updateMeetingTodo(id, todoId, organizationId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingTaskUpdateFailed"),
    });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id, todoId } = await context.params;
    const { organizationId } = await getSessionIds();
    return backendResponse(await deleteMeetingTodo(id, todoId, organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingTaskDeleteFailed"),
    });
  }
}
