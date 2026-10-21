import { type NextRequest, NextResponse } from "next/server";

import {
  fetchDocumentRequests,
  replaceDocumentRequests,
} from "@/lib/api/document-requests";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

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
      return missingScope();
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
      return missingScope();
    }
    const body = (await request.json()) as { titles?: unknown };
    const titles = Array.isArray(body.titles)
      ? body.titles.filter(
          (title): title is string => typeof title === "string",
        )
      : [];
    const actorId = await getSessionMentorId();
    return backendResponse(
      await replaceDocumentRequests(scope, { actorId, titles }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("requestedDocumentsSaveFailed"),
    });
  }
}
