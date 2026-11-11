import type { NextRequest } from "next/server";
import { z } from "zod";

import { revokeGateBadge } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

const revokeSchema = z.object({ reason: z.string().trim().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const { id, awardId } = await params;
    const body = await readJsonBody(request, revokeSchema, {
      invalidMessage: "badgeRevokeReasonRequired",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await revokeGateBadge(auth.session.userId, id, awardId, body.data.reason),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgeRevokeFailed"),
    });
  }
}
