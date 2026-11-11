import type { NextRequest } from "next/server";
import { z } from "zod";

import { createProgram, fetchPrograms } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { requireCoordinatorMentorOrAdminSession } from "@/lib/server/require-program-access";

const createProgramSchema = z.object({ name: z.string().trim().min(1) });

export async function GET() {
  try {
    const auth = await requireCoordinatorMentorOrAdminSession();
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
    const auth = await requireCoordinatorOrAdminSession(
      "coordinatorsOnlyManage",
    );
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
