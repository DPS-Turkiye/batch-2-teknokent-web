import type { NextRequest } from "next/server";

import { fetchUser } from "@/lib/api/accounts";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { id } = await params;
    return backendResponse(await fetchUser(id, session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("userLoadFailed"),
    });
  }
}
