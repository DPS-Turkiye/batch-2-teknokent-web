import { NextResponse, type NextRequest } from "next/server";

import {
  isMentorRequestAction,
  MentorRequestAction,
  mutateMentorRequest,
} from "@/lib/api/mentor-requests";
import { HttpMethod } from "@/lib/http-method";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ action: string; id: string }>;
};

async function forward(request: NextRequest, context: RouteContext) {
  try {
    const { action, id } = await context.params;
    if (!isMentorRequestAction(action)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("mentorRequestActionUnsupported"),
        },
        { status: 400 },
      );
    }

    const { userId } = await getSessionIds();
    const method = request.method as HttpMethod;
    let data: Record<string, unknown> | undefined;
    if (method !== HttpMethod.Get) {
      const body = await readJsonBody(request, jsonObjectSchema);
      if (!body.ok) return body.response;
      data = body.data;
    }
    const mentorId =
      action === MentorRequestAction.Decision ||
      action === MentorRequestAction.MentorMessages
        ? await getSessionMentorId()
        : undefined;
    return backendResponse(
      await mutateMentorRequest({
        action,
        data,
        id,
        method,
        requesterId: userId,
        mentorId,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorRequestActionFailed"),
    });
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
