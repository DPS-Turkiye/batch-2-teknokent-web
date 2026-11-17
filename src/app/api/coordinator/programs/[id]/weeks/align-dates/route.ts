import type { NextRequest } from "next/server";

import { alignProgramDates } from "@/lib/api/program-weeks";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Context) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await alignProgramDates(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("weekPlanAlignFailed"),
    });
  }
}
