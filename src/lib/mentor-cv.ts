import { toCvParseResult } from "@/hooks/use-cv-parse";
import type { ParsedProfile } from "@/interfaces/mentor-onboarding";
import type { ParsedCvProfile } from "@/lib/client/profile-analysis";

export type MentorCvRole = {
  title: string;
  organization: string;
  period: string;
  summary: string;
};

export type MentorCvResult = {
  fullName: string;
  title: string;
  company: string;
  about: string;
  experienceLevel: string;
  sectorExperience: string;
  specialties: string[];
  history: MentorCvRole[];
};

const text = (value: string | null | undefined) => value?.trim() ?? "";

export function toMentorCvResult(profile: ParsedCvProfile): MentorCvResult {
  const years = profile.years_of_experience;
  return {
    fullName: text(profile.full_name),
    title: text(profile.current_role),
    company: text(profile.current_company),
    about: text(profile.professional_summary),
    experienceLevel:
      years && years > 0 ? `${years} yıl` : text(profile.experience_level),
    sectorExperience: (profile.industries ?? [])
      .map((industry) => industry.trim())
      .filter(Boolean)
      .join(", "),
    specialties: toCvParseResult(profile).expertise,
    history: (profile.work_history ?? [])
      .map((role) => ({
        title: text(role.title),
        organization: text(role.organization),
        period: text(role.period),
        summary: text(role.summary),
      }))
      .filter((role) => role.title),
  };
}

/**
 * Signup reads the CV once, right after it is chosen; anything the applicant
 * already typed wins, and the areas it names are added as options to pick.
 */
export function fillOnboardingProfile(
  profile: ParsedProfile,
  cv: MentorCvResult,
): ParsedProfile {
  const keep = (current: string, next: string) =>
    current.trim() ? current : next;
  return {
    fullName: keep(profile.fullName, cv.fullName),
    title: keep(profile.title, cv.title),
    company: keep(profile.company, cv.company),
    totalExperience: keep(profile.totalExperience, cv.experienceLevel),
    history: profile.history.length ? profile.history : cv.history,
    inferredAreas: [
      ...profile.inferredAreas,
      ...cv.specialties.filter((area) => !profile.inferredAreas.includes(area)),
    ],
  };
}

type MentorCvForm = {
  professionalTitle: string;
  company: string;
  about: string;
  experienceLevel: string;
  sectorExperience: string;
  specialties: string[];
  experiences: MentorCvRole[];
};

const roleKey = (role: { title: string; organization: string }) =>
  `${role.title.trim().toLocaleLowerCase("tr")}|${role.organization.trim().toLocaleLowerCase("tr")}`;

/**
 * The mentor asked for it and can still Vazgeç, so what the CV says replaces
 * the text fields. Specialties and past roles are only added to, and a role
 * already listed is not listed twice.
 */
export function applyMentorCv<F extends MentorCvForm>(
  form: F,
  cv: MentorCvResult,
  maxExperiences: number,
): F {
  const pick = (current: string, next: string) => next || current;
  const listed = new Set(form.experiences.map(roleKey));
  return {
    ...form,
    professionalTitle: pick(form.professionalTitle, cv.title),
    company: pick(form.company, cv.company),
    about: pick(form.about, cv.about),
    experienceLevel: pick(form.experienceLevel, cv.experienceLevel),
    sectorExperience: pick(form.sectorExperience, cv.sectorExperience),
    specialties: [
      ...form.specialties,
      ...cv.specialties.filter((area) => !form.specialties.includes(area)),
    ],
    experiences: [
      ...form.experiences,
      ...cv.history.filter((role) => !listed.has(roleKey(role))),
    ].slice(0, maxExperiences),
  };
}
