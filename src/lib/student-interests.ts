import type { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type {
  ProfileCompletionCategory,
  StudentProfileCompletion,
} from "@/interfaces/student-profile-completion";

type Interests = Pick<StudentProfileCompletion, "topics" | "subtopics">;

/** Adds or removes a topic; removing one drops the sub-topics that belong to it. */
export function toggleInterestTopic<T extends Interests>(
  current: T,
  id: PeerTopicCategory,
  categories: ProfileCompletionCategory[],
): T {
  const topics = current.topics.includes(id)
    ? current.topics.filter((value) => value !== id)
    : [...current.topics, id];
  const valid = categories
    .filter((item) => topics.includes(item.id))
    .flatMap((item) => item.subtopics.map((subtopic) => subtopic.id));
  return {
    ...current,
    topics,
    subtopics: current.subtopics.filter((value) => valid.includes(value)),
  };
}

export function toggleInterestSubtopic<T extends Interests>(
  current: T,
  id: string,
): T {
  return {
    ...current,
    subtopics: current.subtopics.includes(id)
      ? current.subtopics.filter((value) => value !== id)
      : [...current.subtopics, id],
  };
}

/** The categories the student picked, in catalogue order, with their sub-topics. */
export function chosenCategories(
  categories: ProfileCompletionCategory[],
  topics: readonly PeerTopicCategory[],
) {
  return categories.filter((item) => topics.includes(item.id));
}
