import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerMentorFilter,
  PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getPeerMentors(
  filter: PeerMentorFilter,
): Promise<PeerMentorCard[]> {
  return requireSuccess(
    await httpClient.get<PeerMentorCard[]>("/api/peer-mentoring/mentors", {
      params: {
        category: filter.category ?? undefined,
        q: filter.query || undefined,
      },
    }),
  );
}

export async function getPeerMentoringRequests(): Promise<
  PeerMentoringRequest[]
> {
  return requireSuccess(
    await httpClient.get<PeerMentoringRequest[]>(
      "/api/peer-mentoring/requests",
    ),
  );
}

export async function createPeerMentoringRequest(
  input: CreatePeerMentoringRequestInput,
): Promise<PeerMentoringRequest> {
  return requireSuccess(
    await httpClient.post<PeerMentoringRequest>(
      "/api/peer-mentoring/requests",
      input,
    ),
  );
}
