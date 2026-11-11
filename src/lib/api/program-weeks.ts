import "server-only";

import type {
  ProgramPlanWeekInput,
  ProgramThisWeek,
  ProgramWeekPlan,
} from "@/interfaces/program-week";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const planUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/weeks`;

export function fetchProgramWeekPlan(actorId: string, programId: string) {
  return backendRequest<ProgramWeekPlan>({
    method: HttpMethod.Get,
    url: planUrl(programId),
    params: { actorId },
  });
}

export function replaceProgramWeekPlan(
  actorId: string,
  programId: string,
  weeks: ProgramPlanWeekInput[],
) {
  return backendRequest<ProgramWeekPlan>({
    method: HttpMethod.Put,
    url: planUrl(programId),
    data: { actorId, weeks },
  });
}

/** The caller's own program's running week and its plan. */
export function fetchProgramThisWeek(actorId: string) {
  return backendRequest<ProgramThisWeek>({
    method: HttpMethod.Get,
    url: "/api/programs/mine/this-week",
    params: { actorId },
  });
}
