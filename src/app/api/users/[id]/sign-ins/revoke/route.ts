import type { NextRequest } from "next/server";

import { revokeSignIns } from "@/lib/api/accounts";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    return backendResponse(await revokeSignIns(id, auth.session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("signInRevokeFailed"),
    });
  }
}
