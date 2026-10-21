import { type NextRequest } from "next/server";

import { fetchMeetingNoteDocument } from "@/lib/api/meeting-notes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchMeetingNoteDocument(id, organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("meetingNoteDocumentUnavailable"),
    });
  }
}
