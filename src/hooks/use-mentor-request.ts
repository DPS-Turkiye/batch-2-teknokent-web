"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";

import type { MentorProfile } from "@/interfaces/mentor";
import {
  getMentorRecommendations,
  type RecommendationSpecification,
} from "@/lib/client/mentor-recommendations";
import {
  submitMentorshipRequest,
  type MentorshipRequestSubmission,
} from "@/lib/mentorship-requests";

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
  const submissionMutation = useMutation({
    mutationFn: (submission: MentorshipRequestSubmission) =>
      submitMentorshipRequest(submission),
  });

  return {
    baseMentors,
    isMatching: recommendationMutation.isPending,
    isSubmitting: submissionMutation.isPending,
    matchingError: recommendationMutation.error?.message ?? "",
    mentors: recommendationMutation.data?.mentors ?? baseMentors,
    prepareRecommendations: recommendationMutation.mutateAsync,
    recommendationMetadata: recommendationMutation.data?.metadata ?? null,
    submissionError: submissionMutation.error?.message ?? "",
    submitRequest: submissionMutation.mutateAsync,
  };
}
