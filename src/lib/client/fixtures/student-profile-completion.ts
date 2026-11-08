import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type {
  ProfileCompletionCategory,
  StudentProfileCompletion,
} from "@/interfaces/student-profile-completion";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
// Board category labels, sample subtopics only. No production IDs/API are implied.
export const PROFILE_COMPLETION_CATEGORIES: ProfileCompletionCategory[] = [
  {
    id: PeerTopicCategory.AcademicDevelopment,
    subtopics: [{ id: "fixture-study", labelKey: "study" }],
  },
  {
    id: PeerTopicCategory.CareerInternship,
    subtopics: [{ id: "fixture-cv", labelKey: "cv" }],
  },
  {
    id: PeerTopicCategory.TechnicalDigital,
    subtopics: [{ id: "fixture-code", labelKey: "code" }],
  },
  {
    id: PeerTopicCategory.ResearchAcademicCareer,
    subtopics: [{ id: "fixture-methods", labelKey: "methods" }],
  },
  {
    id: PeerTopicCategory.Entrepreneurship,
    subtopics: [{ id: "fixture-project", labelKey: "project" }],
  },
  {
    id: PeerTopicCategory.CampusLife,
    subtopics: [{ id: "fixture-clubs", labelKey: "clubs" }],
  },
  {
    id: PeerTopicCategory.PersonalProfessional,
    subtopics: [{ id: "fixture-time", labelKey: "time" }],
  },
  {
    id: PeerTopicCategory.International,
    subtopics: [{ id: "fixture-exchange", labelKey: "exchange" }],
  },
];

export const EMPTY_PROFILE_COMPLETION: StudentProfileCompletion = {
  topics: [],
  subtopics: [],
  goal: "",
  completed: false,
  skipped: false,
};
