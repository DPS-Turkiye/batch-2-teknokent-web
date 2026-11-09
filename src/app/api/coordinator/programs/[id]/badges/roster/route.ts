import type { NextRequest } from "next/server";

import { fetchProgramBadgeRoster } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { gateBadgeStateParam } from "@/lib/server/gate-badge-state";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramBadgeRoster(
        auth.session.userId,
        id,
        gateBadgeStateParam(request.nextUrl.searchParams.get("state")),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgesLoadFailed"),
    });
  }
}
