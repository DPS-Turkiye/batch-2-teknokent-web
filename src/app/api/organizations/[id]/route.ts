import type { NextRequest } from "next/server";

import { fetchOrganization } from "@/lib/api/organization";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";
import { SessionRequiredError } from "@/lib/server/session-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchOrganization(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("startupProfileLoadFailed"),
    });
  }
}
