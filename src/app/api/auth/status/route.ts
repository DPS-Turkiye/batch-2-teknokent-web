import { NextRequest, NextResponse } from "next/server";

import { fetchSignedInUser } from "@/lib/api/auth";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

const BEARER_PREFIX = "Bearer ";

export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get("authorization");
    const idToken = header?.startsWith(BEARER_PREFIX)
      ? header.slice(BEARER_PREFIX.length).trim()
      : null;

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
