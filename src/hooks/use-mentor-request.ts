"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import type { MentorProfile } from "@/interfaces/mentor";
import {
  getMentorRecommendations,
  type RecommendationSpecification,
} from "@/lib/client/mentor-recommendations";

export function useMentorRequest(
  initialMentors: MentorProfile[],
  excludedMentor: string | null,
) {
  const baseMentors = useMemo(
    () =>
      excludedMentor
        ? initialMentors.filter((mentor) => mentor.fullName !== excludedMentor)
        : initialMentors,
    [excludedMentor, initialMentors],
  );
  const recommendationMutation = useMutation({
    mutationFn: (specification: RecommendationSpecification) =>
      getMentorRecommendations(specification),
  });

  return {
    baseMentors,
    isMatching: recommendationMutation.isPending,
    matchingError: recommendationMutation.error?.message ?? "",
    mentors: recommendationMutation.data?.mentors ?? baseMentors,
    recommendedMentors: recommendationMutation.data?.mentors ?? [],
    prepareRecommendations: recommendationMutation.mutateAsync,
    recommendationMetadata: recommendationMutation.data?.metadata ?? null,
  };
}
