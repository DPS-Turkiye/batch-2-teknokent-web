import type { MentorProfile } from "@/interfaces/mentor";

export type MentorSort = "best" | "name";

export type MentorDirectoryFilters = {
  availability: string;
  query: string;
  sort: MentorSort;
  specialty: string;
  startupStage: string;
};

export const DEFAULT_MENTOR_FILTERS: MentorDirectoryFilters = {
  availability: "",
  query: "",
  sort: "best",
  specialty: "",
  startupStage: "",
};

export function mentorSearchText(mentor: MentorProfile): string {
  return [
    mentor.fullName,
    mentor.professionalTitle,
    mentor.company,
    mentor.sectorExperience,
    mentor.experienceLevel,
    mentor.startupStages,
    mentor.meetingMode,
    mentor.mentoringStyle,
    mentor.availabilityLabel,
    ...mentor.specialties,
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");
}

export function mentorExpertiseLabel(mentor: MentorProfile): string {
  const specialties = mentor.specialties.filter((item) => item.trim());
  if (specialties.length) return specialties.slice(0, 2).join(" & ");
  return mentor.professionalTitle;
}

export function uniqueSpecialties(mentors: MentorProfile[]): string[] {
  return uniqueSorted(mentors.flatMap((mentor) => mentor.specialties));
}

export function uniqueStartupStages(mentors: MentorProfile[]): string[] {
  return uniqueSorted(
    mentors.flatMap((mentor) => splitTokens(mentor.startupStages)),
  );
}

export function uniqueAvailability(mentors: MentorProfile[]): string[] {
  return uniqueSorted(
    mentors.map((mentor) => mentor.availabilityLabel).filter(Boolean),
  );
}

export function filterMentors(
  mentors: MentorProfile[],
  query: string,
): MentorProfile[] {
  return applyMentorDirectory(mentors, {
    ...DEFAULT_MENTOR_FILTERS,
    query,
  });
}

export function applyMentorDirectory(
  mentors: MentorProfile[],
  filters: MentorDirectoryFilters,
): MentorProfile[] {
  const needle = filters.query.trim().toLocaleLowerCase("tr-TR");
  const specialty = filters.specialty.trim().toLocaleLowerCase("tr-TR");
  const stage = filters.startupStage.trim().toLocaleLowerCase("tr-TR");
  const availability = filters.availability.trim().toLocaleLowerCase("tr-TR");

  const filtered = mentors.filter((mentor) => {
    if (needle && !mentorSearchText(mentor).includes(needle)) return false;
    if (
      specialty &&
      !mentor.specialties.some(
        (item) => item.toLocaleLowerCase("tr-TR") === specialty,
      )
    ) {
      return false;
    }
    if (
      stage &&
      !mentor.startupStages.toLocaleLowerCase("tr-TR").includes(stage)
    ) {
      return false;
    }
    if (
      availability &&
      mentor.availabilityLabel.toLocaleLowerCase("tr-TR") !== availability
    ) {
      return false;
    }
    return true;
  });

  if (filters.sort === "name") {
    return [...filtered].sort((left, right) =>
      left.fullName.localeCompare(right.fullName, "tr"),
    );
  }
  return filtered;
}

function splitTokens(value: string): string[] {
  return value
    .split(/[,&/]| ve /)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "tr"),
  );
}
