import type { NextRequest } from "next/server";

import { searchCoordinators } from "@/lib/api/admin-coordinators";
import { coordinatorSearchSchema } from "@/lib/server/admin-coordinator-schemas";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readSearchParams } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;
    const query = await readSearchParams(
      request.nextUrl.searchParams,
      coordinatorSearchSchema,
    );
    if (!query.ok) return query.response;
    return backendResponse(
      await searchCoordinators(auth.session.userId, query.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("coordinatorSearchFailed"),
    });
  }
}
