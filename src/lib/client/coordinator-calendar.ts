import type { CoordinatorCalendar } from "@/interfaces/coordinator-calendar";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getCoordinatorCalendar(range: {
  from: string;
  to: string;
  programId: string | null;
}) {
  const { programId, ...days } = range;
  return requireSuccess(
    await httpClient.get<CoordinatorCalendar>("/api/coordinator/calendar", {
      params: programId ? { ...days, programId } : days,
    }),
  );
}
