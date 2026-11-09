import "server-only";

import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerMentorProfile,
  SavePeerMentorProfileInput,
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

/** The categories the caller may use: their program's (MENTEE) or the programs they mentor in (MENTOR). */
export function fetchPeerCategories(
  actorId: string,
  side: UserRole.Mentee | UserRole.Mentor,
) {
  return backendRequest<PeerTopicCategory[]>({
    method: HttpMethod.Get,
    url: "/api/peer-mentoring/categories",
    params: { actorId, as: side },
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

export function fetchPeerMentorProfile(actorId: string) {
  return backendRequest<PeerMentorProfile>({
    method: HttpMethod.Get,
    url: "/api/peer-mentoring/profile",
    params: { actorId },
  });
}

export function savePeerMentorProfile(
  actorId: string,
  input: SavePeerMentorProfileInput,
) {
  return backendRequest<PeerMentorProfile>({
    method: HttpMethod.Put,
    url: "/api/peer-mentoring/profile",
    data: { ...input, actorId },
  });
}
