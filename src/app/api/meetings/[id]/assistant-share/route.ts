import { NextRequest, NextResponse } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  fetchAssistantShare,
  publishAssistantShare,
} from "@/lib/api/meeting-notes";
import { publishAssistantShareBodySchema } from "@/lib/notes-schemas";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireMentorSession } from "@/lib/server/require-program-access";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await context.params;
    if (session.role === UserRole.Mentor) {
      return backendResponse(
        await fetchAssistantShare(id, { viewerId: session.userId }),
      );
    }
    if (!session.organizationId) throw new SessionRequiredError();
    return backendResponse(
      await fetchAssistantShare(id, { organizationId: session.organizationId }),
    );
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
