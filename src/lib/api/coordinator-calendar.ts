import "server-only";

import type { CoordinatorCalendar } from "@/interfaces/coordinator-calendar";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchCoordinatorCalendar(
  actorId: string,
  range: { from: string; to: string; programId: string | null },
) {
  const { programId, ...days } = range;
  return backendRequest<CoordinatorCalendar>({
    method: "GET",
    url: "/api/coordinator/calendar",
    params: programId ? { actorId, ...days, programId } : { actorId, ...days },
  });
}
