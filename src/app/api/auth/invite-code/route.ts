import type { NextRequest } from "next/server";
import { z } from "zod";

import { checkInviteCode } from "@/lib/api/invite-code";
import { INVITE_CODE_MAX_LENGTH } from "@/lib/invite-intent";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { clientAddress } from "@/lib/server/client-address";
import { readJsonBody } from "@/lib/server/request-body";

const inviteCodeSchema = z.object({
  code: z.string().trim().min(1).max(INVITE_CODE_MAX_LENGTH),
});

// Public: /invite checks the code before any login exists. The backend answers only valid + team name.
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, inviteCodeSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await checkInviteCode(body.data.code, clientAddress(request.headers)),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("inviteCodeCheckFailed"),
    });
  }
}
