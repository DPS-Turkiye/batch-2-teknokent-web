import { NextRequest, NextResponse } from "next/server";

import { fetchProgramEligibility } from "@/lib/api/auth";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function GET(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    const programId = request.nextUrl.searchParams.get("programId");
    if (!idToken || !programId) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("firebaseTokenRequired"),
        },
        { status: 400 },
      );
    }
    return backendResponse(await fetchProgramEligibility(programId, idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("registrationFailed"),
    });
  }
}
