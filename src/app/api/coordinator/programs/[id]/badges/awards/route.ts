import type { NextRequest } from "next/server";
import { z } from "zod";

import { awardGateBadge } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const awardSchema = z.object({ userId: z.string().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, awardSchema, {
      invalidMessage: "badgeAwardFailed",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await awardGateBadge(auth.session.userId, id, body.data.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgeAwardFailed"),
    });
  }
}
