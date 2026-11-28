import type {
  ProgramPlanWeek,
  ProgramPlanWeekInput,
  ProgramSpecialDay,
  ProgramThisWeek,
  ProgramWeekPlan,
  ProgramWeeksSoFar,
  WeekVisibility,
} from "@/interfaces/program-week";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { httpClient } from "@/lib/http-client";

const planUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/weeks`;

export async function getProgramWeekPlan(programId: string) {
  return requireSuccess(
    await backendHttp.get<ProgramWeekPlan>(planUrl(programId)),
  );
}

export async function saveProgramWeekPlan(
  programId: string,
  weeks: ProgramPlanWeekInput[],
  specialDays: ProgramSpecialDay[],
) {
  return requireSuccess(
    await backendHttp.put<ProgramWeekPlan>(planUrl(programId), {
      weeks,
      specialDays,
    }),
  );
}

export async function setProgramWeekVisibility(
  programId: string,
  week: number,
  visibility: WeekVisibility,
) {
  return requireSuccess(
    await backendHttp.put<ProgramPlanWeek>(
      `${planUrl(programId)}/${week}/visibility`,
      { visibility },
    ),
  );
}

export async function getProgramThisWeek() {
  return requireSuccess(
    await httpClient.get<ProgramThisWeek>("/api/programs/mine/this-week"),
  );
}

export async function getProgramWeeksSoFar() {
  return requireSuccess(
    await httpClient.get<ProgramWeeksSoFar>("/api/programs/mine/weeks"),
  );
}

export async function alignProgramDates(programId: string) {
  return requireSuccess(
    await backendHttp.post<ProgramWeekPlan>(
      `${planUrl(programId)}/align-dates`,
    ),
  );
}
