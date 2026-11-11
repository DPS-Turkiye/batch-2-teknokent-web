import type { NextRequest } from "next/server";

import { fetchUser } from "@/lib/api/accounts";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await getSessionIds();
    const { id } = await params;
    return backendResponse(await fetchUser(id, userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("userLoadFailed"),
    });
  }
}
