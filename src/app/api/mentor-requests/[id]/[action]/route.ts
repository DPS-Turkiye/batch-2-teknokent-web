import { NextRequest, NextResponse } from "next/server";

import {
  isMentorRequestAction,
  MentorRequestAction,
  mutateMentorRequest,
} from "@/lib/api/mentor-requests";
import { HttpMethod } from "@/lib/http-method";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ action: string; id: string }>;
};

async function forward(request: NextRequest, context: RouteContext) {
  try {
    const { action, id } = await context.params;
    if (!isMentorRequestAction(action)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Unsupported request action." },
        { status: 400 },
      );
    }

    const { userId } = await getSessionIds();
    const method = request.method as HttpMethod;
    const data =
      method === HttpMethod.Get
        ? undefined
        : ((await request.json()) as Record<string, unknown>);
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
      message: "Mentorship request action failed.",
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
