import { NextResponse, type NextRequest } from "next/server";

import { fetchSignedInUser } from "@/lib/api/auth";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function GET(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);

    if (!idToken) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("firebaseTokenRequired"),
        },
        { status: 400 },
      );
    }

    return backendResponse(await fetchSignedInUser(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("applicationStatusFailed"),
    });
  }
}
