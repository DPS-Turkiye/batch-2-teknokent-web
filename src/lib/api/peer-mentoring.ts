import "server-only";

import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerMentoringRequest,
  PeerTopicCategory,
} from "@/interfaces/peer-mentoring";
import type { UserRole } from "@/interfaces/session";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

export function fetchPeerMentors(
  actorId: string,
  filter: { category?: PeerTopicCategory; q?: string },
) {
  return backendRequest<PeerMentorCard[]>({
    method: HttpMethod.Get,
    url: "/api/peer-mentoring/mentors",
    params: { actorId, ...filter },
  });
}

export function fetchPeerMentoringRequests(
  actorId: string,
  side: UserRole.Mentee | UserRole.Mentor,
) {
  return backendRequest<PeerMentoringRequest[]>({
    method: HttpMethod.Get,
    url: "/api/peer-mentoring/requests",
    params: { actorId, as: side },
  });
}

export function createPeerMentoringRequest(
  actorId: string,
  input: CreatePeerMentoringRequestInput,
) {
  return backendRequest<PeerMentoringRequest>({
    method: HttpMethod.Post,
    url: "/api/peer-mentoring/requests",
    data: { ...input, actorId },
  });
}
