import { NextResponse } from "next/server";
import { z } from "zod";

import { StartupStage } from "@/interfaces/startup-process";
import { fetchProgramTeamDetail } from "@/lib/api/coordinator-programs";
import {
  fetchStartupProcess,
  updateProcessStage,
} from "@/lib/api/startup-process";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

type Params = { params: Promise<{ id: string; organizationId: string }> };

const stageBodySchema = z.object({ stage: z.enum(StartupStage) });

/**
 * The backend lets any coordinator, the founder or a mentor change a stage; here only a coordinator
 * (or admin) whose program the team is in may, so the team lookup runs first.
 */
async function requireProgramTeam({ params }: Params) {
  const auth = await requireCoordinatorSession();
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

export async function PUT(request: Request, context: Params) {
  try {
    const access = await requireProgramTeam(context);
    if (!access.ok) return access.response;
    const parsed = stageBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("stageInvalid") },
        { status: 400 },
      );
    }
    return backendResponse(
      await updateProcessStage(
        access.organizationId,
        access.actorId,
        parsed.data.stage,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("stageUpdateFailed"),
    });
  }
}
