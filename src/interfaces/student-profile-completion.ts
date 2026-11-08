import type messages from "@/messages/tr.json";
import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";

// UI-only draft contract. Subtopic IDs identify fixtures, not a production taxonomy.
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
