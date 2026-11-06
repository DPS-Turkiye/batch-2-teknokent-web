import { NextRequest, NextResponse } from "next/server";

import {
  fetchMentorPrograms,
  saveMentorPrograms,
} from "@/lib/api/mentor-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

// Mentor onboarding runs before the account is approved, so there is no session cookie; only the Firebase token counts.
async function requireIdToken(request: NextRequest) {
  const idToken = readBearerToken(request);
  if (idToken) return idToken;
  return NextResponse.json(
    {
      code: "INVALID_REQUEST",
      message: await apiText("firebaseTokenRequired"),
    },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const idToken = await requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    return backendResponse(await fetchMentorPrograms(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorProgramsLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const idToken = await requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    const body = (await request.json()) as { programIds?: unknown };
    const programIds = Array.isArray(body.programIds)
      ? body.programIds.filter((id): id is string => typeof id === "string")
      : [];
    return backendResponse(await saveMentorPrograms(idToken, programIds));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorProgramsSaveFailed"),
    });
  }
}
