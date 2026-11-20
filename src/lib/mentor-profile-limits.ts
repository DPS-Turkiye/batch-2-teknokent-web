import type {
  MentorEducationInput,
  MentorExperienceInput,
} from "@/interfaces/mentor";
import type { StudentOnboardingDraft } from "@/interfaces/mentor-onboarding";
import { toStudentProfilePayload } from "@/lib/mentor-onboarding";

/**
 * The backend's limits on a mentor profile save (UpdateMentorProfileRequest and the
 * requests nested in it). The form enforces the same numbers so a save is never
 * refused for a length the mentor could not see; raise one here only together
 * with the backend.
 */
export const MENTOR_PROFILE_LIMITS = {
  text: 200,
  // "Nasıl çalışıyorum" is a paragraph, one line per point (backend V125).
  mentoringStyle: 2000,
  about: 4000,
  experience: { title: 200, organization: 200, period: 100, summary: 300 },
  education: { school: 200, degree: 200, period: 100 },
  programRole: 80,
  // No request rule, but the column is VARCHAR(255): a longer topic fails the save.
  specialty: 255,
  student: {
    department: 255,
    erasmus: 500,
    course: 255,
    project: 500,
    listItems: 10,
  },
} as const;

/** The profile's own text fields, each capped by the backend. */
export const MENTOR_PROFILE_TEXT_FIELDS = [
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
  "about",
] as const;

export type MentorProfileTextField =
  (typeof MENTOR_PROFILE_TEXT_FIELDS)[number];

/** The backend refuses these blank (`@NotBlank`). */
export const REQUIRED_MENTOR_PROFILE_FIELDS = [
  "professionalTitle",
  "experienceLevel",
  "startupStages",
] as const satisfies readonly MentorProfileTextField[];

export function mentorTextFieldLimit(field: MentorProfileTextField) {
  switch (field) {
    case "about":
      return MENTOR_PROFILE_LIMITS.about;
    case "mentoringStyle":
      return MENTOR_PROFILE_LIMITS.mentoringStyle;
    default:
      return MENTOR_PROFILE_LIMITS.text;
  }
}

/** Where a value sits in the save request, e.g. `experiences[0].summary` → experiences, 0, summary. */
export type MentorProfileFieldPath = {
  field: string;
  index: number | null;
  part: string | null;
};

const FIELD_PATH = /^([A-Za-z]+)(?:\[(\d+)\])?(?:\.([A-Za-z]+)(?:\[\d+\])?)?$/;

/** Reads a backend `fieldErrors` key; null for one it cannot read. */
export function parseMentorFieldPath(
  path: string,
): MentorProfileFieldPath | null {
  const match = FIELD_PATH.exec(path);
  if (!match?.[1]) return null;
  return {
    field: match[1],
    index: match[2] === undefined ? null : Number(match[2]),
    part: match[3] ?? null,
  };
}

export const MentorProfileProblemKind = {
  Required: "required",
  TooLong: "tooLong",
  TooMany: "tooMany",
} as const;

export type MentorProfileProblem =
  | {
      kind: typeof MentorProfileProblemKind.Required;
      path: MentorProfileFieldPath;
    }
  | {
      kind: typeof MentorProfileProblemKind.TooLong;
      path: MentorProfileFieldPath;
      max: number;
      length: number;
    }
  | {
      kind: typeof MentorProfileProblemKind.TooMany;
      path: MentorProfileFieldPath;
      max: number;
    };

type CheckedForm = Record<MentorProfileTextField, string> & {
  specialties: string[];
  experiences: MentorExperienceInput[];
  educations: MentorEducationInput[];
  programRoles: { role: string }[];
};

export const EXPERIENCE_PARTS = [
  "title",
  "organization",
  "period",
  "summary",
] as const;
export const EDUCATION_PARTS = ["school", "degree", "period"] as const;
export const STUDENT_PARTS = [
  "department",
  "studyYear",
  "strongCourses",
  "projects",
  "erasmus",
] as const;

function tooLong(
  path: MentorProfileFieldPath,
  value: string,
  max: number,
): MentorProfileProblem[] {
  return value.length > max
    ? [
        {
          kind: MentorProfileProblemKind.TooLong,
          path,
          max,
          length: value.length,
        },
      ]
    : [];
}

const isBlank = (values: string[]) => values.every((value) => !value.trim());

/** A past role with nothing typed in is dropped before saving. */
export const isBlankExperience = (role: MentorExperienceInput) =>
  isBlank(EXPERIENCE_PARTS.map((part) => role[part]));

/** A school with nothing typed in is dropped before saving. */
export const isBlankSchool = (school: MentorEducationInput) =>
  isBlank(EDUCATION_PARTS.map((part) => school[part]));

/** The description is the one field mentors write at length, so it always shows its count. */
export const alwaysCountsExperiencePart = (
  part: (typeof EXPERIENCE_PARTS)[number],
) => part === "summary";

function studentProblems(draft: StudentOnboardingDraft) {
  const limits = MENTOR_PROFILE_LIMITS.student;
  const sent = toStudentProfilePayload(draft);
  const at = (part: string, index: number | null = null) => ({
    field: "studentProfile",
    index,
    part,
  });
  const list = (part: string, items: string[], max: number) => [
    ...(items.length > limits.listItems
      ? [
          {
            kind: MentorProfileProblemKind.TooMany,
            path: at(part),
            max: limits.listItems,
          },
        ]
      : []),
    ...items.flatMap((item, index) => tooLong(at(part, index), item, max)),
  ];
  return [
    ...tooLong(at("department"), sent.department ?? "", limits.department),
    ...tooLong(at("erasmus"), sent.erasmus ?? "", limits.erasmus),
    ...list("strongCourses", sent.strongCourses, limits.course),
    ...list("projects", sent.projects, limits.project),
  ];
}

/**
 * Rows the mentor left empty are not sent, so the backend's `experiences[1]` is
 * the second non-empty row; this turns it back into the row's place on screen.
 */
export function onScreenPath(
  path: MentorProfileFieldPath,
  form: Pick<CheckedForm, "experiences" | "educations">,
): MentorProfileFieldPath {
  if (path.index === null) return path;
  const kept =
    path.field === "experiences"
      ? form.experiences.flatMap((role, index) =>
          isBlankExperience(role) ? [] : [index],
        )
      : path.field === "educations"
        ? form.educations.flatMap((school, index) =>
            isBlankSchool(school) ? [] : [index],
          )
        : null;
  return kept ? { ...path, index: kept[path.index] ?? path.index } : path;
}

/**
 * Every blank required field and every value over the backend's limit, in the
 * order the save request lists them. Past roles and schools left wholly empty
 * are dropped before saving, so they are not checked; rows keep the number the
 * page shows them under.
 */
export function mentorProfileProblems(
  form: CheckedForm,
  student: StudentOnboardingDraft | null = null,
): MentorProfileProblem[] {
  const top = (field: string) => ({ field, index: null, part: null });
  const required: MentorProfileProblem[] =
    REQUIRED_MENTOR_PROFILE_FIELDS.filter((field) => !form[field].trim()).map(
      (field) => ({
        kind: MentorProfileProblemKind.Required,
        path: top(field),
      }),
    );
  const lengths = MENTOR_PROFILE_TEXT_FIELDS.flatMap((field) =>
    tooLong(top(field), form[field], mentorTextFieldLimit(field)),
  );
  const specialties = form.specialties.flatMap((topic, index) =>
    tooLong(
      { field: "specialties", index, part: null },
      topic,
      MENTOR_PROFILE_LIMITS.specialty,
    ),
  );
  const experiences = form.experiences.flatMap((role, index) =>
    isBlankExperience(role)
      ? []
      : EXPERIENCE_PARTS.flatMap((part) =>
          tooLong(
            { field: "experiences", index, part },
            role[part],
            MENTOR_PROFILE_LIMITS.experience[part],
          ),
        ),
  );
  const educations = form.educations.flatMap((school, index) =>
    isBlankSchool(school)
      ? []
      : EDUCATION_PARTS.flatMap((part) =>
          tooLong(
            { field: "educations", index, part },
            school[part],
            MENTOR_PROFILE_LIMITS.education[part],
          ),
        ),
  );
  const programRoles = form.programRoles.flatMap(({ role }, index) =>
    tooLong(
      { field: "programRoles", index, part: "role" },
      role,
      MENTOR_PROFILE_LIMITS.programRole,
    ),
  );
  return [
    ...required,
    ...lengths,
    ...specialties,
    ...experiences,
    ...educations,
    ...programRoles,
    ...(student ? studentProblems(student) : []),
  ];
}

// Close to the limit is where the count starts to matter; further off it is noise.
const COUNTER_FROM_SHARE = 0.8;

/** Whether a field shows its "n / max" count: always for long text, near the limit for the rest. */
export function showsCharacterCount(
  length: number,
  max: number,
  always = false,
) {
  return always || length >= max * COUNTER_FROM_SHARE;
}

/**
 * Cuts text the mentor did not type (a CV reading) to a backend limit, ending
 * on a whole word with "…" so the cut shows, and never halving an emoji.
 */
export function clipText(value: string, max: number) {
  if (value.length <= max) return value;
  if (max <= 1) return max === 1 ? "…" : "";
  let end = max - 1;
  const last = value.charCodeAt(end - 1);
  if (last >= 0xd800 && last <= 0xdbff) end -= 1;
  const cut = value.slice(0, end);
  const lastSpace = cut.lastIndexOf(" ");
  const words = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${words.trimEnd()}…`;
}
