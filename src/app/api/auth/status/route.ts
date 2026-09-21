import { NextRequest, NextResponse } from "next/server";

import { fetchSignedInUser } from "@/lib/api/auth";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function GET(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);

    if (!idToken) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Firebase kimlik anahtarı gerekli.",
        },
        { status: 400 },
      );
    }

    return backendResponse(await fetchSignedInUser(idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Başvuru durumu alınamadı.",
    });
  }
}
