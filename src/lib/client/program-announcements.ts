import type {
  PostProgramAnnouncementInput,
  ProgramAnnouncement,
} from "@/interfaces/program-announcement";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const programUrl = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/announcements`;

export async function getProgramAnnouncements(programId: string) {
  return requireSuccess(
    await backendHttp.get<ProgramAnnouncement[]>(programUrl(programId)),
  );
}

export async function postProgramAnnouncement(
  programId: string,
  input: PostProgramAnnouncementInput,
) {
  return requireSuccess(
    await backendHttp.post<ProgramAnnouncement>(programUrl(programId), input),
  );
}

export async function getMyAnnouncements() {
  return requireSuccess(
    await backendHttp.get<ProgramAnnouncement[]>("/api/program-announcements"),
  );
}
