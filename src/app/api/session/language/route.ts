import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { saveSignedInLanguage } from "@/lib/api/auth";
import { Locale } from "@/lib/i18n";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readJsonBody } from "@/lib/server/request-body";

const languageSchema = z.object({ language: z.enum(Locale) });

export async function PUT(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    if (!idToken) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("languageSaveFailed"),
        },
        { status: 400 },
      );
    }
    const body = await readJsonBody(request, languageSchema, {
      invalidMessage: "languageSaveFailed",
    });
    if (!body.ok) return body.response;
    const response = await saveSignedInLanguage(idToken, body.data.language);
    return new NextResponse(null, { status: response.status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("languageSaveFailed"),
    });
  }
}
