import type {
  PeerTopicCategory,
  ProgramPeerCategories,
} from "@/interfaces/peer-mentoring";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

const url = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/peer-categories`;

export async function getProgramPeerCategories(programId: string) {
  return requireSuccess(
    await backendHttp.get<ProgramPeerCategories>(url(programId)),
  );
}

export async function replaceProgramPeerCategories(
  programId: string,
  categories: PeerTopicCategory[],
) {
  return requireSuccess(
    await backendHttp.put<ProgramPeerCategories>(url(programId), {
      categories,
    }),
  );
}
