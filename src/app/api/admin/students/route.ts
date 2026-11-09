import type { NextRequest } from "next/server";

import { fetchAdminStudents } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { gateBadgeStateParam } from "@/lib/server/gate-badge-state";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    return backendResponse(
      await fetchAdminStudents(
        auth.session.userId,
        gateBadgeStateParam(request.nextUrl.searchParams.get("state")),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgesLoadFailed"),
    });
  }
}
