"use client";

import { useAdviseeProfile } from "@/hooks/use-institution-record";
import { PROFILE_COMPLETION_CATEGORIES } from "@/lib/client/fixtures/student-profile-completion";
import { chosenCategories, chosenSubtopics } from "@/lib/student-interests";

/**
 * An advisee's interests and goal for the academician's student profile, labelled the way the student's own
 * Profilim labels them. The backend already keeps only topics active in the student's program, so the whole
 * catalogue is enough here. Asks only for an advisee: the endpoint answers nothing for anyone else's student.
 */
export function useAdviseeInterests(userId: string) {
  const query = useAdviseeProfile(userId);
  const profile = query.data ?? null;
  const interests = profile?.interests ?? { topics: [], subtopics: [] };
  const topics = chosenCategories(
    PROFILE_COMPLETION_CATEGORIES,
    interests.topics,
  ).map((item) => item.id);
  const goal = profile?.goal.trim() ?? "";
  return {
    /** null while loading, after a failure, or when the backend says this is not their advisee. */
    profile,
    topics,
    subtopics: chosenSubtopics(PROFILE_COMPLETION_CATEGORIES, interests),
    goal,
    isEmpty: topics.length === 0 && goal === "",
    isLoading: query.isLoading,
    error: query.error,
    retry: () => void query.refetch(),
    isRetrying: query.isRefetching,
  };
}
