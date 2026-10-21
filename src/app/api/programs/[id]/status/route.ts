import { NextRequest, NextResponse } from "next/server";

import { ProgramStatus } from "@/interfaces/program";
import { updateProgramStatus } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES = new Set<string>(Object.values(ProgramStatus));

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    if (!body.status || !STATUSES.has(body.status)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("programStatusInvalid"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await updateProgramStatus(
        auth.session.userId,
        id,
        body.status as ProgramStatus,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programStatusUpdateFailed"),
    });
  }
}
