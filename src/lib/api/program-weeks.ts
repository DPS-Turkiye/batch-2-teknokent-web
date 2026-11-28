import "server-only";

import type {
  ProgramThisWeek,
  ProgramWeeksSoFar,
} from "@/interfaces/program-week";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

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

