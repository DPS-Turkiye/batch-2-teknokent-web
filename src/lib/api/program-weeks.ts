import "server-only";

import type {
  ProgramPlanWeekInput,
  ProgramSpecialDay,
  ProgramThisWeek,
  ProgramWeekPlan,
  ProgramWeeksSoFar,
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
  specialDays: ProgramSpecialDay[],
) {
  return backendRequest<ProgramWeekPlan>({
    method: HttpMethod.Put,
    url: planUrl(programId),
    data: {
      actorId,
      weeks,
      specialDays,
    },
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

/** The weeks of the caller's own program reached so far, the running one included. */
export function fetchProgramWeeksSoFar(actorId: string) {
  return backendRequest<ProgramWeeksSoFar>({
    method: HttpMethod.Get,
    url: "/api/programs/mine/weeks",
    params: { actorId },
  });
}

export function alignProgramDates(actorId: string, programId: string) {
  return backendRequest<ProgramWeekPlan>({
    method: HttpMethod.Post,
    url: `${planUrl(programId)}/align-dates`,
    params: { actorId },
  });
}
