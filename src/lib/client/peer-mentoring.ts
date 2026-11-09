import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerMentorProfile,
  SavePeerMentorProfileInput,
  PeerMentorFilter,
  PeerMentoringRequest,
} from "@/interfaces/peer-mentoring";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
import { UserRole } from "@/interfaces/session";
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

/** Requests other students sent to the signed-in peer mentor. */
export async function getReceivedPeerRequests(): Promise<
  PeerMentoringRequest[]
> {
  return requireSuccess(
    await httpClient.get<PeerMentoringRequest[]>(
      "/api/peer-mentoring/requests",
      { params: { as: UserRole.Mentor } },
    ),
  );
}

/** The signed-in peer mentor's profile, or null before the wizard has published one. */
export async function getPeerMentorProfile(): Promise<PeerMentorProfile | null> {
  try {
    return requireSuccess(
      await httpClient.get<PeerMentorProfile>("/api/peer-mentoring/profile"),
    );
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 404) return null;
    throw error;
  }
}

export async function savePeerMentorProfile(
  input: SavePeerMentorProfileInput,
): Promise<PeerMentorProfile> {
  return requireSuccess(
    await httpClient.put<PeerMentorProfile>(
      "/api/peer-mentoring/profile",
      input,
    ),
  );
}
