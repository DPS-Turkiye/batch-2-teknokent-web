import type { NextRequest } from "next/server";
import { z } from "zod";

import { fetchTeamMoveOptions, moveMemberToTeam } from "@/lib/api/team-moves";
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

const moveSchema = z.object({
  targetOrganizationId: z.uuid(),
});

/** Admins and coordinators; the backend checks both teams' programs and takes the caller from the token. */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const idToken = readBearerToken(request);
    if (!idToken) throw new SessionRequiredError();
    const person = await readUuidParam(
      (await context.params).id,
      "personIdInvalid",
    );
    if (!person.ok) return person.response;
    return backendResponse(await fetchTeamMoveOptions(person.id, idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMoveLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorOrAdminSession();
    if (!auth.ok) return auth.response;
    const idToken = readBearerToken(request);
    if (!idToken) throw new SessionRequiredError();
    const person = await readUuidParam(
      (await context.params).id,
      "personIdInvalid",
    );
    if (!person.ok) return person.response;
    const body = await readJsonBody(request, moveSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await moveMemberToTeam(
        person.id,
        body.data.targetOrganizationId,
        idToken,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMoveFailed"),
    });
  }
}
