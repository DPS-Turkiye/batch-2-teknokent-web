import { NextResponse, type NextRequest } from "next/server";

import { fetchMeetingNote, saveMeetingNote } from "@/lib/api/meeting-notes";
import { saveMeetingNoteBodySchema } from "@/lib/notes-schemas";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
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
      message: "Meeting note service is unavailable.",
    });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = saveMeetingNoteBodySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "content is required.",
        },
        { status: 400 },
      );
    }

    const session = await getSessionIds();
    return backendResponse(await saveMeetingNote(id, session, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting note could not be saved.",
    });
  }
}
