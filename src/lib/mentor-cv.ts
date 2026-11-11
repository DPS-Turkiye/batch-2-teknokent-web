import { toCvParseResult } from "@/hooks/use-cv-parse";
import { MAX_EDUCATIONS, type MentorEducationInput } from "@/interfaces/mentor";
import type {
  ParsedProfile,
  StudentOnboardingDraft,
} from "@/interfaces/mentor-onboarding";
import type { ParsedCvProfile } from "@/lib/client/profile-analysis";
import { withKeys, type Keyed } from "@/lib/keyed-list";
import { isStudentLevel } from "@/lib/student-topics";

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
  education: MentorEducationInput[];
  /** A student mentor's studies, empty for anyone else. */
  studies: StudentOnboardingDraft;
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
    education: (profile.education ?? [])
      .map((school) => ({
        school: text(school.school),
        degree: text(school.degree),
        period: text(school.period),
      }))
      .filter((school) => school.school),
    studies: toStudies(profile),
  };
}

function toStudies(profile: ParsedCvProfile): StudentOnboardingDraft {
  const list = (values: string[] | null | undefined) =>
    (values ?? []).map((value) => value.trim()).filter(Boolean);
  const year = text(profile.study_year);
  return {
    department: text(profile.department),
    studyYear: isStudentLevel(year) ? year : "",
    courses: list(profile.strong_courses).join(", "),
    projects: list(profile.student_projects).join("\n"),
    erasmus: text(profile.exchange_experience),
  };
}

/**
 * Signup keeps what the student already typed; on the profile page the mentor
 * asked for the CV, so whatever it found replaces the field (as applyMentorCv does).
 */
export function fillStudies(
  current: StudentOnboardingDraft,
  cv: StudentOnboardingDraft,
  cvFirst = false,
): StudentOnboardingDraft {
  const choose = (mine: string, found: string) =>
    cvFirst ? found || mine : mine.trim() ? mine : found;
  return {
    department: choose(current.department, cv.department),
    studyYear: choose(current.studyYear, cv.studyYear),
    courses: choose(current.courses, cv.courses),
    projects: choose(current.projects, cv.projects),
    erasmus: choose(current.erasmus, cv.erasmus),
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
    history: profile.history.length ? profile.history : withKeys(cv.history),
    education: profile.education.length
      ? profile.education
      : withKeys(cv.education),
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
  experiences: Keyed<MentorCvRole>[];
  educations: Keyed<MentorEducationInput>[];
};

const schoolKey = (school: MentorEducationInput) =>
  `${school.school.trim().toLocaleLowerCase("tr")}|${school.degree.trim().toLocaleLowerCase("tr")}`;

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
  maxEducations = MAX_EDUCATIONS,
): F {
  const schools = new Set(form.educations.map(schoolKey));
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
      ...withKeys(cv.history.filter((role) => !listed.has(roleKey(role)))),
    ].slice(0, maxExperiences),
    educations: [
      ...form.educations,
      ...withKeys(
        cv.education.filter((school) => !schools.has(schoolKey(school))),
      ),
    ].slice(0, maxEducations),
  };
}
