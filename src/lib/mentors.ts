import { getTranslations } from "next-intl/server";
import "server-only";

import type { MentorProfile } from "@/interfaces/mentor";
import { fetchMentorProfile } from "@/lib/api/mentor-profile";
import { fetchOrganizationPrograms } from "@/lib/api/programs";
import { HttpMethod } from "@/lib/http-method";
import {
  MentorPageAccess,
  mentorPageAccess,
  sharedProgramNames,
} from "@/lib/mentor-access";
import { backendRequest } from "@/lib/server/backend-client";
import { getSessionIds } from "@/lib/session";

export class MentorFetchError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MentorFetchError";
  }
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isMentorEvidence(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const evidence = value as Record<string, unknown>;
  return (
    typeof evidence.category === "string" &&
    typeof evidence.claim === "string" &&
    typeof evidence.quote === "string" &&
    (evidence.sourcePage === null || typeof evidence.sourcePage === "number") &&
    typeof evidence.profileVersion === "string"
  );
}

export function isMentorProfile(value: unknown): value is MentorProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const mentor = value as Record<string, unknown>;
  const stringFields = [
    "id",
    "fullName",
    "email",
    "initials",
    "professionalTitle",
    "company",
    "availabilityLabel",
    "responseTimeLabel",
    "meetingMode",
    "communicationPreference",
    "mentoringStyle",
    "fitLabel",
    "experienceLevel",
    "sectorExperience",
    "startupStages",
  ];

  return (
    stringFields.every((field) => typeof mentor[field] === "string") &&
    isStringArray(mentor.specialties) &&
    isStringArray(mentor.recommendationReasons) &&
    Array.isArray(mentor.recommendationEvidence) &&
    mentor.recommendationEvidence.every(isMentorEvidence)
  );
}

export async function fetchMentors(): Promise<MentorProfile[]> {
  try {
    const { userId } = await getSessionIds();
    const response = await backendRequest({
      method: HttpMethod.Get,
      params: { actorId: userId },
      url: "/api/mentors",
    });

    if (response.status !== 200) {
      throw new MentorFetchError(`Mentor API returned HTTP ${response.status}`);
    }

    if (
      !Array.isArray(response.data) ||
      !response.data.every(isMentorProfile)
    ) {
      throw new MentorFetchError("Mentor API response has an invalid shape");
    }

    return response.data;
  } catch (error) {
    if (error instanceof MentorFetchError) {
      throw error;
    }

    throw new MentorFetchError("Mentor API request failed", error);
  }
}

export async function loadMentors(): Promise<{
  mentors: MentorProfile[];
  error?: string;
}> {
  try {
    return { mentors: await fetchMentors() };
  } catch (error) {
    const message =
      error instanceof MentorFetchError
        ? error.message
        : (await getTranslations("loadErrors"))("mentorsUnexpected");
    return { mentors: [], error: message };
  }
}

async function fetchMentorById(
  mentorId: string,
): Promise<MentorProfile | null> {
  try {
    const response = await fetchMentorProfile(mentorId);
    return response.status === 200 && isMentorProfile(response.data)
      ? response.data
      : null;
  } catch {
    return null;
  }
}

/** The viewer's programs, taken from the session; none for someone outside programs. */
async function viewerProgramIds(): Promise<string[]> {
  try {
    const { userId } = await getSessionIds();
    const response = await fetchOrganizationPrograms(userId);
    if (response.status !== 200) return [];
    return response.data.programs.map((program) => program.id);
  } catch {
    return [];
  }
}

export type MentorPage = {
  mentor: MentorProfile;
  /** Shared programs when the profile is view-only; null when the viewer may send a request. */
  viewOnlyPrograms: string[] | null;
};

/** The mentor a profile page shows, or null when the viewer may not see them. */
export async function loadMentorPage(
  mentorId: string,
): Promise<MentorPage | null> {
  const { mentors } = await loadMentors();
  const reachable = mentors.find((item) => item.id === mentorId);
  if (reachable) return { mentor: reachable, viewOnlyPrograms: null };

  const [mentor, programIds] = await Promise.all([
    fetchMentorById(mentorId),
    viewerProgramIds(),
  ]);
  if (
    !mentor ||
    mentorPageAccess({
      reachable: false,
      mentor,
      viewerProgramIds: programIds,
    }) !== MentorPageAccess.ViewOnly
  ) {
    return null;
  }
  return {
    mentor,
    viewOnlyPrograms: sharedProgramNames(mentor, programIds),
  };
}
