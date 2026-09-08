import { NextRequest, NextResponse } from "next/server";

import { inviteProgramMentor } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = (await request.json()) as { mentorId?: string };
    if (!body.mentorId) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Bir mentor seçmeniz gerekiyor." },
        { status: 400 },
      );
    }
    return backendResponse(
      await inviteProgramMentor(auth.session.userId, id, body.mentorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentor davet edilemedi.",
    });
  }
}
