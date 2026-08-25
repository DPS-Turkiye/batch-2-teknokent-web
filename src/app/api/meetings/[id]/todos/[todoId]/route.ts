import { NextResponse, type NextRequest } from "next/server";

import { deleteMeetingTodo, updateMeetingTodo } from "@/lib/api/meeting-notes";
import { updateMeetingTodoBodySchema } from "@/lib/notes-schemas";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string; todoId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id, todoId } = await context.params;
    const body = updateMeetingTodoBodySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Provide a title or a done flag.",
        },
        { status: 400 },
      );
    }

    const { organizationId } = await getSessionIds();
    return backendResponse(
      await updateMeetingTodo(id, todoId, organizationId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting todo could not be updated.",
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
      message: "Meeting todo could not be removed.",
    });
  }
}
