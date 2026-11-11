import type { NextRequest } from "next/server";
import { z } from "zod";

import { UserAccountStatus } from "@/interfaces/session";
import { decideAccountStatus } from "@/lib/api/accounts";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireAdminSession } from "@/lib/server/require-admin";

const decisionSchema = z.object({
  status: z.enum([UserAccountStatus.Approved, UserAccountStatus.Rejected]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) return auth.response;

    const body = await readJsonBody(request, decisionSchema, {
      invalidMessage: "statusMustBeDecision",
    });
    if (!body.ok) return body.response;

    const { id } = await context.params;
    return backendResponse(
      await decideAccountStatus(id, auth.session.userId, body.data.status),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("accountStatusUpdateFailed"),
    });
  }
}
