import type messages from "@/messages/tr.json";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";

/**
 * The student's saved interests and goal (`GET`/`PUT /api/student/profile-completion`). Topics are the program's
 * active categories; sub-topic ids are still the catalogue's samples until the board names real ones.
 */
export type StudentProfileCompletion = {
  topics: PeerTopicCategory[];
  subtopics: string[];
  goal: string;
  completed: boolean;
  skipped: boolean;
};

export type ProfileCompletionCategory = {
  id: PeerTopicCategory;
  subtopics: {
    id: string;
    labelKey: keyof (typeof messages)["studentProfileCompletion"]["subtopics"];
  }[];
};

export enum ProfileCompletionStep {
  Topics,
  Subtopics,
  Goal,
}
