import { fetchProgramTeamDetail } from "@/lib/api/coordinator-programs";
import { fetchStartupProcess } from "@/lib/api/startup-process";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorOrAdminSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; organizationId: string }> };

/**
 * A team's Süreç as its program's coordinator sees it in the Takımlar drawer. Only a coordinator (or admin) whose
 * program the team is in may read it, so the team lookup runs first. The phase follows the program's dates, so
 * there is nothing to change here.
 */
async function requireProgramTeam({ params }: Params) {
  const auth = await requireCoordinatorOrAdminSession();
  if (!auth.ok) return auth;
  const { id, organizationId } = await params;
  const team = await fetchProgramTeamDetail(
    auth.session.userId,
    id,
    organizationId,
  );
  if (team.status !== 200) {
    return { ok: false as const, response: backendResponse(team) };
  }
  return { ok: true as const, actorId: auth.session.userId, organizationId };
}

export async function GET(_request: Request, context: Params) {
  try {
    const access = await requireProgramTeam(context);
    if (!access.ok) return access.response;
    return backendResponse(
      await fetchStartupProcess(access.organizationId, access.actorId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamStageLoadFailed"),
    });
  }
}
