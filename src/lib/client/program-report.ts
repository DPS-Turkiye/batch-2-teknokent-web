import type { AdminOverview } from "@/interfaces/admin-overview";
import type { ProgramMeetingRatings } from "@/interfaces/program-report";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function programUrl(programId: string) {
  return `/api/coordinator/programs/${encodeURIComponent(programId)}`;
}

export async function getProgramReport(programId: string) {
  return requireSuccess(
    await httpClient.get<AdminOverview>(`${programUrl(programId)}/report`),
  );
}

export async function getProgramMeetingRatings(
  programId: string,
  from: string | null,
) {
  return requireSuccess(
    await httpClient.get<ProgramMeetingRatings>(
      `${programUrl(programId)}/meeting-ratings`,
      { params: from ? { from } : undefined },
    ),
  );
}
