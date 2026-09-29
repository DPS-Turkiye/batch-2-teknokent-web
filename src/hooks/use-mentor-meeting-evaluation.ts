"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { UserRole } from "@/interfaces/session";
import { getMeetingFeedback, postMeetingFeedback } from "@/lib/client/meetings";
import {
  answeredQuestionCount,
  evaluationMeetingMeta,
  evaluationPayload,
  isEvaluationComplete,
  type MentorEvaluationAnswers,
} from "@/lib/mentor-evaluation";
import { initials } from "@/lib/utils";
import type { OutcomeClarity } from "@/types/mentor-evaluation";

export const meetingFeedbackQueryKey = (meetingId: string) =>
  ["meeting-feedback", meetingId] as const;

/** The mentor's three-question evaluation of one held meeting. */
export function useMentorMeetingEvaluation(meetingId: string) {
  const queryClient = useQueryClient();
  const meetingsQuery = useMeetings();
  const requestsQuery = useMentorshipRequests(UserRole.Mentor);
  const feedbackQuery = useQuery({
    queryKey: meetingFeedbackQueryKey(meetingId),
    queryFn: () => getMeetingFeedback(meetingId),
    enabled: Boolean(meetingId),
  });
  const [answers, setAnswers] = useState<MentorEvaluationAnswers>({
    preparedness: null,
    qualities: [],
    clarity: null,
    note: "",
  });

  const submit = useMutation({
    mutationFn: () =>
      postMeetingFeedback(meetingId, evaluationPayload(answers)),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: meetingFeedbackQueryKey(meetingId),
      }),
  });

  const meeting = meetingsQuery.data?.find((item) => item.id === meetingId);
  const request = meeting?.mentorshipRequestId
    ? requestsQuery.data?.find(
        (item) => item.id === meeting.mentorshipRequestId,
      )
    : undefined;
  const startupName =
    meeting?.organizationName ?? request?.organizationName ?? "";

  return {
    answers,
    answered: answeredQuestionCount(answers),
    canSubmit: isEvaluationComplete(answers) && !submit.isPending,
    error: submit.error,
    isLoading: meetingsQuery.isLoading || feedbackQuery.isLoading,
    isSubmitting: submit.isPending,
    isSent: Boolean(feedbackQuery.data) || submit.isSuccess,
    meeting,
    meta: meeting ? evaluationMeetingMeta(meeting, request) : "",
    startupInitials: initials(startupName),
    startupName,
    setClarity: (clarity: OutcomeClarity) =>
      setAnswers((current) => ({ ...current, clarity })),
    setNote: (note: string) => setAnswers((current) => ({ ...current, note })),
    setPreparedness: (preparedness: number) =>
      setAnswers((current) => ({ ...current, preparedness })),
    submit: () => {
      if (isEvaluationComplete(answers)) submit.mutate();
    },
    toggleQuality: (quality: string) =>
      setAnswers((current) => ({
        ...current,
        qualities: current.qualities.includes(quality)
          ? current.qualities.filter((item) => item !== quality)
          : [...current.qualities, quality],
      })),
  };
}
