import type {
  CreatePeerMentoringRequestInput,
  PeerMentorCard,
  PeerMentorFilter,
  PeerMentoringRequest,
  PeerMentorProfile,
  PeerTopicCategory,
  SavePeerMentorProfileInput,
} from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import { ClientApiError, requireSuccess } from "@/lib/client/api";
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

/** The active categories of the student's program, or (as a peer mentor) of the programs they mentor in. */
export async function getPeerCategories(
  side: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee,
): Promise<PeerTopicCategory[]> {
  return requireSuccess(
    await httpClient.get<PeerTopicCategory[]>(
      "/api/peer-mentoring/categories",
      side === UserRole.Mentor
        ? { params: { as: UserRole.Mentor } }
        : undefined,
    ),
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
