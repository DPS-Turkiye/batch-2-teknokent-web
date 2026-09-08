import { NextRequest, NextResponse } from "next/server";

import { addProgramStartup } from "@/lib/api/programs";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = (await request.json()) as { organizationId?: string };
    if (!body.organizationId) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Bir startup seçmeniz gerekiyor." },
        { status: 400 },
      );
    }
    return backendResponse(
      await addProgramStartup(auth.session.userId, id, body.organizationId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Startup programa eklenemedi.",
    });
  }
}
