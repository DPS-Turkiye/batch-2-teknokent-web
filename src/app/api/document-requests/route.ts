import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  fetchDocumentRequests,
  replaceDocumentRequests,
} from "@/lib/api/document-requests";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

const titlesSchema = z.object({ titles: z.array(z.string()) });

function scopeFrom(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return {
    mentorshipRequestId: params.get("mentorshipRequestId") ?? undefined,
    meetingId: params.get("meetingId") ?? undefined,
    mentorshipId: params.get("mentorshipId") ?? undefined,
  };
}

async function missingScope() {
  return NextResponse.json(
    {
      code: "INVALID_REQUEST",
      message: await apiText("documentRequestTargetRequired"),
    },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    await getSessionIds();
    const scope = scopeFrom(request);
    if (!scope.mentorshipRequestId && !scope.meetingId && !scope.mentorshipId) {
      return await missingScope();
    }
    return backendResponse(await fetchDocumentRequests(scope));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("requestedDocumentsLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const scope = scopeFrom(request);
    if (!scope.mentorshipRequestId && !scope.meetingId && !scope.mentorshipId) {
      return await missingScope();
    }
    const body = await readJsonBody(request, titlesSchema);
    if (!body.ok) return body.response;
    const actorId = await getSessionMentorId();
    return backendResponse(
      await replaceDocumentRequests(scope, {
        actorId,
        titles: body.data.titles,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("requestedDocumentsSaveFailed"),
    });
  }
}
