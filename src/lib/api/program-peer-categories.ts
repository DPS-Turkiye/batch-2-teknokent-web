import "server-only";

import type {
  PeerTopicCategory,
  ProgramPeerCategories,
} from "@/interfaces/peer-mentoring";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

const url = (programId: string) =>
  `/api/coordinator/programs/${encodeURIComponent(programId)}/peer-categories`;

export function fetchProgramPeerCategories(actorId: string, programId: string) {
  return backendRequest<ProgramPeerCategories>({
    method: HttpMethod.Get,
    url: url(programId),
    params: { actorId },
  });
}

export function replaceProgramPeerCategories(
  actorId: string,
  programId: string,
  categories: PeerTopicCategory[],
) {
  return backendRequest<ProgramPeerCategories>({
    method: HttpMethod.Put,
    url: url(programId),
    data: { actorId, categories },
  });
}
