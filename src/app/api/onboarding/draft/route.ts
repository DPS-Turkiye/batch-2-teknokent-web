import { NextRequest, NextResponse } from "next/server";

import {
  deleteOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/api/onboarding-draft";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

const BEARER_PREFIX = "Bearer ";

function readIdToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim() || null;
}

function requireIdToken(request: NextRequest) {
  const idToken = readIdToken(request);
  if (idToken) return idToken;
  return NextResponse.json(
    {
      code: "INVALID_REQUEST",
      message: "A Firebase ID token is required.",
    },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const idToken = requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    return backendResponse(await fetchOnboardingDraft(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "The onboarding draft could not be loaded.",
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const idToken = requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    const body = (await request.json()) as {
      kind?: string;
      step?: string;
      payload?: unknown;
    };
    return backendResponse(
      await saveOnboardingDraft(idToken, {
        kind: body.kind as "signup-wizard" | "mentor-onboarding",
        step: String(body.step ?? ""),
        payload: body.payload,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "The onboarding draft could not be saved.",
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const idToken = requireIdToken(request);
    if (idToken instanceof NextResponse) return idToken;
    return backendResponse(await deleteOnboardingDraft(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "The onboarding draft could not be cleared.",
    });
  }
}
