import type {
  MentorEducation,
  MentorExperience,
  MentorProfile,
} from "@/interfaces/mentor";

/** "4 / 6" with a capacity, "4" without, null when the backend sent no counts. */
export function menteeLoadLabel(mentor: MentorProfile) {
  if (mentor.activeMenteeCount === undefined) return null;
  return mentor.menteeCapacity
    ? `${mentor.activeMenteeCount} / ${mentor.menteeCapacity}`
    : String(mentor.activeMenteeCount);
}

/** "ODTÜ · Lisans, Bilgisayar Mühendisliği · 2022 – 2026" */
export function educationLine(education: MentorEducation) {
  return [education.school, education.degree, education.period]
    .filter(Boolean)
    .join(" · ");
}

export function experienceHeading(experience: MentorExperience) {
  return [experience.title, experience.organization]
    .filter(Boolean)
    .join(" · ");
}

export function experienceDetail(experience: MentorExperience) {
  return [experience.period, experience.summary].filter(Boolean).join(" · ");
}
