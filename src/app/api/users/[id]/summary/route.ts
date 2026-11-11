import { NextResponse, type NextRequest } from "next/server";

import { fetchPersonSummary } from "@/lib/api/person-summary";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";
import { isUuid } from "@/lib/utils";

/** For admins and the person's coordinators; the backend checks the program. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: await apiText("personSummaryLoadFailed"),
        },
        { status: 404 },
      );
    }
    return backendResponse(await fetchPersonSummary(id, auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("personSummaryLoadFailed"),
    });
  }
}
