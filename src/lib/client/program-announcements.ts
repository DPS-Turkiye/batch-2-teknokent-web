import type { ProgramAnnouncement } from "@/interfaces/program-announcement";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/announcements`;

export async function getProgramAnnouncements(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramAnnouncement[]>(programUrl(programId)),
  );
}

export async function postProgramAnnouncement(programId: string, body: string) {
  return requireSuccess(
    await httpClient.post<ProgramAnnouncement>(programUrl(programId), { body }),
  );
}

export async function getMyAnnouncements() {
  return requireSuccess(
    await httpClient.get<ProgramAnnouncement[]>("/api/program-announcements"),
  );
}
