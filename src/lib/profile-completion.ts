import type { InstitutionRecord, StudyLevel } from "@/interfaces/institution";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  ProfileCompletionStep,
  type ProfileCompletionCategory,
  type StudentProfileCompletion,
} from "@/interfaces/student-profile-completion";
import { CompletionStepState, WelcomeFact } from "@/types/profile-completion";

export const PROFILE_COMPLETION_STEPS = [
  ProfileCompletionStep.Welcome,
  ProfileCompletionStep.Topics,
  ProfileCompletionStep.Goal,
] as const;

const ICONS = "/ia/profile";

/** The icon on each support-topic card (Figma "Profil Tamamlama — 2"). */
export const PEER_TOPIC_ICONS: Record<PeerTopicCategory, string> = {
  [PeerTopicCategory.AcademicDevelopment]: `${ICONS}/book.svg`,
  [PeerTopicCategory.CareerInternship]: `${ICONS}/career.svg`,
  [PeerTopicCategory.TechnicalDigital]: `${ICONS}/idea.svg`,
  [PeerTopicCategory.ResearchAcademicCareer]: `${ICONS}/academic.svg`,
  [PeerTopicCategory.Entrepreneurship]: `${ICONS}/star.svg`,
  [PeerTopicCategory.CampusLife]: `${ICONS}/group.svg`,
  [PeerTopicCategory.PersonalProfessional]: `${ICONS}/user.svg`,
  [PeerTopicCategory.International]: `${ICONS}/external-link.svg`,
};

export function completionStepState(
  step: ProfileCompletionStep,
  current: ProfileCompletionStep,
): CompletionStepState {
  if (step < current) return CompletionStepState.Done;
  return step === current
    ? CompletionStepState.Current
    : CompletionStepState.Upcoming;
}

/** The chosen topics and sub-topics in catalogue order, for the summary on the last step. */
export function completionSummary(
  categories: readonly ProfileCompletionCategory[],
  draft: Pick<StudentProfileCompletion, "topics" | "subtopics">,
) {
  const chosen = categories.filter((item) => draft.topics.includes(item.id));
  return {
    topics: chosen.map((item) => item.id),
    subtopics: chosen
      .flatMap((item) => item.subtopics)
      .filter((sub) => draft.subtopics.includes(sub.id)),
  };
}

/** "Doç. Dr. Elif Şahin": the title, when there is one, before the name. */
export function titledName(title: string | null, fullName: string) {
  return [title, fullName].filter(Boolean).join(" ");
}

/**
 * The read-only rows of "ODTÜ'den gelen bilgiler"; `null` where the record has nothing. `classLabel` words the
 * class year and study level ("3. sınıf · Lisans") in the reader's language.
 */
export function welcomeFacts(
  record: InstitutionRecord,
  classLabel: (year: number | null, level: StudyLevel | null) => string | null,
): { key: WelcomeFact; value: string | null }[] {
  return [
    { key: WelcomeFact.FullName, value: record.fullName },
    { key: WelcomeFact.Email, value: record.email },
    { key: WelcomeFact.Department, value: record.departmentName },
    {
      key: WelcomeFact.ClassYear,
      value: classLabel(record.classYear, record.programLevel),
    },
    {
      key: WelcomeFact.Advisor,
      value: record.advisor
        ? titledName(record.advisor.academicTitle, record.advisor.fullName)
        : null,
    },
  ];
}
