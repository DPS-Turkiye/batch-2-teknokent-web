import type {
  CreatePeerMentoringRequestInput,
  PeerCategoryCount,
  PeerMentorCard,
  PeerMentorDetail,
  PeerMentorFilter,
  PeerMentoringRequest,
  PeerMentorProfile,
  PeerMentorProfileDraft,
  PeerTopicCategory,
  SavedPeerMentorProfileDraft,
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
        subTopic: filter.subTopic ?? undefined,
        availableThisWeek: filter.availableThisWeek ? true : undefined,
      },
    }),
  );
}

/** One peer mentor of the student's program, or null when their directory doesn't list them. */
export async function getPeerMentor(
  mentorId: string,
): Promise<PeerMentorDetail | null> {
  try {
    return requireSuccess(
      await httpClient.get<PeerMentorDetail>(
        `/api/peer-mentoring/mentors/${encodeURIComponent(mentorId)}`,
      ),
    );
  } catch (error) {
    // The proxy answers 400 only for an id that isn't a uuid, which can't name a listed mentor either.
    if (
      error instanceof ClientApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

/** Mentors per category active in the student's program. */
export async function getPeerMentorCounts(): Promise<PeerCategoryCount[]> {
  return requireSuccess(
    await httpClient.get<PeerCategoryCount[]>(
      "/api/peer-mentoring/mentor-counts",
    ),
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

/** The student's unfinished wizard, or null when there is none. */
export async function getPeerMentorDraft(): Promise<SavedPeerMentorProfileDraft | null> {
  try {
    return requireSuccess(
      await httpClient.get<SavedPeerMentorProfileDraft>(
        "/api/peer-mentoring/profile/draft",
      ),
    );
  } catch (error) {
    if (error instanceof ClientApiError && error.status === 404) return null;
    throw error;
  }
}

export async function savePeerMentorDraft(
  draft: PeerMentorProfileDraft,
): Promise<SavedPeerMentorProfileDraft> {
  return requireSuccess(
    await httpClient.put<SavedPeerMentorProfileDraft>(
      "/api/peer-mentoring/profile/draft",
      { draft },
    ),
  );
}

export async function deletePeerMentorDraft(): Promise<void> {
  requireSuccess(
    await httpClient.delete<undefined>("/api/peer-mentoring/profile/draft"),
  );
}
