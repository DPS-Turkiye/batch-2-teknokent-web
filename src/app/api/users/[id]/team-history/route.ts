import type { NextRequest } from "next/server";

import { fetchTeamHistory } from "@/lib/api/team-changes";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

/** For admins and the person's coordinators; the backend checks the program. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchTeamHistory(id, auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamHistoryLoadFailed"),
    });
  }
}
