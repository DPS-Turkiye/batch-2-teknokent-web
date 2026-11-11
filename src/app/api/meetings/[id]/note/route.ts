import type { NextRequest } from "next/server";

import { fetchMeetingNote, saveMeetingNote } from "@/lib/api/meeting-notes";
import { saveMeetingNoteBodySchema } from "@/lib/notes-schemas";
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
    return backendResponse(await fetchMeetingNote(id, organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingNoteServiceUnavailable"),
    });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await readJsonBody(request, saveMeetingNoteBodySchema, {
      invalidMessage: "noteContentRequired",
    });
    if (!body.ok) return body.response;

    const session = await getSessionIds();
    return backendResponse(await saveMeetingNote(id, session, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingNoteSaveFailed"),
    });
  }
}
