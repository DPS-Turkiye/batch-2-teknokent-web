import type { MentorProfile } from "@/interfaces/mentor";

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
