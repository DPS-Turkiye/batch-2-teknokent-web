import { NextRequest, NextResponse } from "next/server";

import { isRegisterRole, registerAccount } from "@/lib/api/auth";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";

const BEARER_PREFIX = "Bearer ";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> },
) {
  try {
    const { role } = await params;
    if (!isRegisterRole(role)) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Kayıt rolü tanınmıyor." },
        { status: 404 },
      );
    }

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

    const payload = await request.json();
    return backendResponse(await registerAccount(role, payload, idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Kayıt tamamlanamadı.",
    });
  }
}
