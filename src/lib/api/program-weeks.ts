import "server-only";

import type {
  ProgramPlanWeek,
  ProgramPlanWeekInput,
  ProgramSpecialDay,
  ProgramWeekPlan,
  WeekVisibility,
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

/** Who besides the coordinators sees saved week `week`; the backend checks the actor may edit the plan. */
export function setProgramWeekVisibility(
  actorId: string,
  programId: string,
  week: number,
  visibility: WeekVisibility,
) {
  return backendRequest<ProgramPlanWeek>({
    method: HttpMethod.Put,
    url: `${planUrl(programId)}/${week}/visibility`,
    data: { actorId, visibility },
  });
}

export function alignProgramDates(actorId: string, programId: string) {
  return backendRequest<ProgramWeekPlan>({
    method: HttpMethod.Post,
    url: `${planUrl(programId)}/align-dates`,
    params: { actorId },
  });
}
