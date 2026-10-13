import type { MentorProfile } from "@/interfaces/mentor";

export const MENTOR_PICK_FILTERS = [
  "recommended",
  "all",
  "expertise",
  "availability",
  "online",
  "in-person",
] as const;

export type MentorPickFilterId = (typeof MENTOR_PICK_FILTERS)[number];

export const DEFAULT_MENTOR_PICK_FILTER: MentorPickFilterId = "recommended";

export function mentorsForPickFilter(
  filter: MentorPickFilterId,
  recommended: readonly MentorProfile[],
  all: readonly MentorProfile[],
) {
  switch (filter) {
    case "recommended":
      return [...recommended];
    case "all":
      return [...all];
    case "expertise":
      return all.filter((mentor) =>
        mentor.specialties.some((tag) => tag.trim()),
      );
    case "availability":
      return all.filter((mentor) => mentor.availabilityLabel.trim());
    case "online":
      return all.filter((mentor) =>
        mentor.meetingMode.toLocaleLowerCase("tr-TR").includes("online"),
      );
    case "in-person":
      return all.filter((mentor) => {
        const mode = mentor.meetingMode.toLocaleLowerCase("tr-TR");
        return mode.includes("yüz yüze") || mode.includes("in person");
      });
  }
}
