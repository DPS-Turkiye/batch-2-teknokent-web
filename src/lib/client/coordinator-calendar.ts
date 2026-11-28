import type { CoordinatorCalendar } from "@/interfaces/coordinator-calendar";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

export async function getCoordinatorCalendar(range: {
  from: string;
  to: string;
  programId: string | null;
}) {
  const { programId, ...days } = range;
  return requireSuccess(
    await backendHttp.get<CoordinatorCalendar>("/api/coordinator/calendar", {
      params: programId ? { ...days, programId } : days,
    }),
  );
}
