import { z } from "zod";

import {
  addProgramTeams,
  fetchProgramTeams,
} from "@/lib/api/coordinator-programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { teamInviteSchema } from "@/lib/server/coordinator-program-schemas";
import { readJsonBody } from "@/lib/server/request-body";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

const addTeamsSchema = z.object({ teams: z.array(teamInviteSchema) });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    return backendResponse(await fetchProgramTeams(auth.session.userId, id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamsLoadFailed"),
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = await readJsonBody(request, addTeamsSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await addProgramTeams(auth.session.userId, id, body.data.teams),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamsAddFailed"),
    });
  }
}
