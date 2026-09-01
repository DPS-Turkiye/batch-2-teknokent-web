import { NextRequest, NextResponse } from "next/server";

import { createProgram, fetchPrograms } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import {
  requireCoordinatorOrMentorSession,
  requireCoordinatorSession,
} from "@/lib/server/require-program-access";

export async function GET() {
  try {
    const auth = await requireCoordinatorOrMentorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchPrograms(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Programs could not be loaded.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim() ?? "";
    if (!name) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "A program name is required." },
        { status: 400 },
      );
    }
    return backendResponse(await createProgram(auth.session.userId, name));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "The program could not be created.",
    });
  }
}
