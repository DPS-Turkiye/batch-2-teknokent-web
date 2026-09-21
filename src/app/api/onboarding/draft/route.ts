import { NextRequest, NextResponse } from "next/server";

import {
  deleteOnboardingDraft,
  fetchOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/api/onboarding-draft";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

function requireIdToken(request: NextRequest) {
  const idToken = readBearerToken(request);
  if (idToken) return idToken;
  return NextResponse.json(
    {
      code: "INVALID_REQUEST",
      message: "Firebase kimlik anahtarı gerekli.",
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
      message: "Kayıt taslağı yüklenemedi.",
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
      message: "Kayıt taslağı kaydedilemedi.",
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
      message: "Kayıt taslağı silinemedi.",
    });
  }
}
