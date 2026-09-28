import "server-only";

import type { ProgramAnnouncement } from "@/interfaces/program-announcement";
import { backendRequest } from "@/lib/server/backend-client";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/announcements`;

export function fetchProgramAnnouncements(actorId: string, programId: string) {
  return backendRequest<ProgramAnnouncement[]>({
    method: "GET",
    url: programUrl(programId),
    params: { actorId },
  });
}

export function postProgramAnnouncement(
  actorId: string,
  programId: string,
  body: string,
) {
  return backendRequest<ProgramAnnouncement>({
    method: "POST",
    url: programUrl(programId),
    data: { actorId, body },
  });
}

export function fetchMyAnnouncements(actorId: string) {
  return backendRequest<ProgramAnnouncement[]>({
    method: "GET",
    url: "/api/program-announcements",
    params: { actorId },
  });
}
