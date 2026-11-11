import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  deleteOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/api/onboarding-draft";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readJsonBody } from "@/lib/server/request-body";

const draftSchema = z.object({
  kind: z.enum(["signup-wizard", "mentor-onboarding"]),
  step: z.string(),
  payload: z.unknown(),
});

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
    return backendResponse(await fetchOnboardingDraft(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("signupDraftLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const idToken = await requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    const body = await readJsonBody(request, draftSchema);
    if (!body.ok) return body.response;
    return backendResponse(await saveOnboardingDraft(idToken, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("signupDraftSaveFailed"),
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const idToken = await requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    return backendResponse(await deleteOnboardingDraft(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("signupDraftDeleteFailed"),
    });
  }
}
