import { NextRequest, NextResponse } from "next/server";

import { saveSignedInLanguage } from "@/lib/api/auth";
import { isLocale } from "@/lib/i18n";
import { apiErrorResponse } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function PUT(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    const body = (await request.json().catch(() => ({}))) as {
      language?: unknown;
    };
    if (!idToken || !isLocale(body.language)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Dil kaydedilemedi." },
        { status: 400 },
      );
    }
    const response = await saveSignedInLanguage(idToken, body.language);
    return new NextResponse(null, { status: response.status });
  } catch (error) {
    return apiErrorResponse(error, { message: "Dil kaydedilemedi." });
  }
}
