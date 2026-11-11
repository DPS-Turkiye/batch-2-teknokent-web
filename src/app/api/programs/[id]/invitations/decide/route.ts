import type { NextRequest } from "next/server";
import { z } from "zod";

import { decideProgramInvitation } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { requireMentorSession } from "@/lib/server/require-program-access";

const decisionSchema = z.object({ accepted: z.boolean() });

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireMentorSession();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await readJsonBody(request, decisionSchema, {
      invalidMessage: "decisionRequired",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await decideProgramInvitation(
        auth.session.userId,
        id,
        body.data.accepted,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("inviteAnswerFailed"),
    });
  }
}
