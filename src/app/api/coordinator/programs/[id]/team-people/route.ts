import type { NextRequest } from "next/server";

import { fetchProgramTeamPeople } from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(
      await fetchProgramTeamPeople(
        auth.session.userId,
        id,
        request.nextUrl.searchParams.get("q") ?? "",
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamPeopleSearchFailed"),
    });
  }
}
