import type { NextRequest } from "next/server";

import { fetchPersonSummary } from "@/lib/api/person-summary";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readUuidParam } from "@/lib/server/path-params";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

/** For admins and the person's coordinators; the backend checks the program. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const person = await readUuidParam((await params).id, "personIdInvalid");
    if (!person.ok) return person.response;
    return backendResponse(
      await fetchPersonSummary(person.id, auth.session.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("personSummaryLoadFailed"),
    });
  }
}
