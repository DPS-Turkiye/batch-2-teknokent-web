import type {
  PeerTopicCategory,
  ProgramPeerCategories,
} from "@/interfaces/peer-mentoring";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

const url = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/peer-categories`;

export async function getProgramPeerCategories(programId: string) {
  return requireSuccess(
    await httpClient.get<ProgramPeerCategories>(url(programId)),
  );
}

export async function replaceProgramPeerCategories(
  programId: string,
  categories: PeerTopicCategory[],
) {
  return requireSuccess(
    await httpClient.put<ProgramPeerCategories>(url(programId), { categories }),
  );
}
