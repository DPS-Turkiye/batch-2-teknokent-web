import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

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
import { readJsonBody } from "@/lib/server/request-body";

const programIdsSchema = z.object({ programIds: z.array(z.string()) });

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
    const body = await readJsonBody(request, programIdsSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await saveMentorPrograms(idToken, body.data.programIds),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorProgramsSaveFailed"),
    });
  }
}
