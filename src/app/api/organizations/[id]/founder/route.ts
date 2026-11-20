import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  changeFounder,
  fetchFounderChangeOptions,
} from "@/lib/api/founder-change";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { readUuidParam } from "@/lib/server/path-params";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";
import { SessionRequiredError } from "@/lib/server/session-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const changeSchema = z.object({
  newFounderId: z.uuid(),
});

/** Admins and coordinators; the backend checks the startup's programs and takes the caller from the token. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const idToken = readBearerToken(request);
    if (!idToken) throw new SessionRequiredError();
    const team = await readUuidParam(
      (await context.params).id,
      "teamIdInvalid",
    );
    if (!team.ok) return team.response;
    return backendResponse(await fetchFounderChangeOptions(team.id, idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("founderChangeLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const idToken = readBearerToken(request);
    if (!idToken) throw new SessionRequiredError();
    const team = await readUuidParam(
      (await context.params).id,
      "teamIdInvalid",
    );
    if (!team.ok) return team.response;
    const body = await readJsonBody(request, changeSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await changeFounder(team.id, body.data.newFounderId, idToken),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("founderChangeFailed"),
    });
  }
}
