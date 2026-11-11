import type { NextRequest } from "next/server";

import { fetchCoordinatorOverview } from "@/lib/api/coordinator-overview";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const programId = request.nextUrl.searchParams.get("programId");
    return backendResponse(
      await fetchCoordinatorOverview(auth.session.userId, programId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("homeLoadFailed"),
    });
  }
}
