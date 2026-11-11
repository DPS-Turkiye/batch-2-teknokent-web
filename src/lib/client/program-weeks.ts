import type {
  ProgramPlanWeekInput,
  ProgramThisWeek,
  ProgramWeekPlan,
} from "@/interfaces/program-week";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const planUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/weeks`;

export async function getProgramWeekPlan(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramWeekPlan>(planUrl(programId)),
  );
}

export async function saveProgramWeekPlan(
  programId: string,
  weeks: ProgramPlanWeekInput[],
) {
  return requireSuccess(
    await httpClient.put<ProgramWeekPlan>(planUrl(programId), { weeks }),
  );
}

export async function getProgramThisWeek() {
  return requireSuccess(
    await httpClient.get<ProgramThisWeek>("/api/programs/mine/this-week"),
  );
}
