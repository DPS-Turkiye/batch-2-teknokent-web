import "server-only";

import type { MentorProfile } from "@/interfaces/mentor";
import { backendRequest } from "@/lib/server/backend-client";

export class MentorFetchError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
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
    const response = await backendRequest<unknown>({
      method: "GET",
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
        : "Mentorlar yüklenirken beklenmeyen bir hata oluştu";
    return { mentors: [], error: message };
  }
}
