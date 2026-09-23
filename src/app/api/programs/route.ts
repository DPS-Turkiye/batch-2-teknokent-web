import { NextRequest, NextResponse } from "next/server";

import { createProgram, fetchPrograms } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { UserRole } from "@/interfaces/session";
import {
  requireCoordinatorOrMentorSession,
  requireCoordinatorSession,
} from "@/lib/server/require-program-access";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const auth = await requireCoordinatorOrMentorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchPrograms(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Programlar yüklenemedi.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const auth =
      session?.role === UserRole.Admin
        ? { ok: true as const, session }
        : await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? "";
    if (!name) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Program adı gerekli." },
        { status: 400 },
      );
    }
    return backendResponse(await createProgram(auth.session.userId, name));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Program oluşturulamadı.",
    });
  }
}
