import { NextRequest, NextResponse } from "next/server";

import {
  fetchAssistantShare,
  publishAssistantShare,
} from "@/lib/api/meeting-notes";
import { publishAssistantShareBodySchema } from "@/lib/notes-schemas";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchAssistantShare(id, organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Assistant share could not be loaded.",
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = publishAssistantShareBodySchema.safeParse(
      await request.json(),
    );
    if (!body.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "A transcript or report payload is required.",
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await publishAssistantShare(id, auth.session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Assistant share could not be published.",
    });
  }
}
