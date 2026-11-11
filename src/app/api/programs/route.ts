import type { NextRequest } from "next/server";
import { z } from "zod";

import { UserRole } from "@/interfaces/session";
import { createProgram, fetchPrograms } from "@/lib/api/programs";
import { hasPermission } from "@/lib/permissions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import {
  requireCoordinatorOrMentorSession,
  requireCoordinatorSession,
} from "@/lib/server/require-program-access";
import { getSessionUser } from "@/lib/session";

const createProgramSchema = z.object({ name: z.string().trim().min(1) });

export async function GET() {
  try {
    const auth = await requireCoordinatorOrMentorSession();
    if (!auth.ok) return auth.response;
    return backendResponse(await fetchPrograms(auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programsLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const auth =
      session && hasPermission(session, UserRole.Admin)
        ? { ok: true as const, session }
        : await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request, createProgramSchema, {
      invalidMessage: "programNameRequired",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await createProgram(auth.session.userId, body.data.name),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("programCreateFailed"),
    });
  }
}
