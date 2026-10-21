"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { useToast } from "@/components/providers/toast-provider";
import { useMeetings, useUpdateMeeting } from "@/hooks/use-meetings";
import { RATED_MEETINGS_QUERY_KEY } from "@/hooks/use-meetings-awaiting-feedback";
import { getMeetingFeedback, postMeetingFeedback } from "@/lib/client/meetings";
import {
  MEETING_FEEDBACK_BENEFITS,
  MEETING_FEEDBACK_QUESTIONS,
} from "@/lib/const";

function chooseMeeting(meetings: MeetingItem[], requestedId: string | null) {
  if (requestedId) {
    const requested = meetings.find((meeting) => meeting.id === requestedId);
    if (requested) return requested;
  }
  return (
    meetings.find((meeting) => meeting.status === MeetingStatus.Scheduled) ??
    meetings[0] ??
    null
  );
}

const KNOWN_FEEDBACK_BENEFITS = new Set<string>(MEETING_FEEDBACK_BENEFITS);

function splitFeedbackBenefits(benefits: string[]) {
  const selected = benefits.filter((benefit) =>
    KNOWN_FEEDBACK_BENEFITS.has(benefit),
  );
  const nextMeetingNote = benefits
    .filter((benefit) => !KNOWN_FEEDBACK_BENEFITS.has(benefit))
    .join("\n");
  return { nextMeetingNote, selected };
}

export function useMeetingLifecycle() {
  const t = useTranslations("meetingPages.summary");
  const { showToast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const meetingsQuery = useMeetings();
  const meeting = useMemo(
    () => chooseMeeting(meetingsQuery.data ?? [], params.get("id")),
    [meetingsQuery.data, params],
  );
  const updateMutation = useUpdateMeeting(meeting?.id);
  const [draft, setDraft] = useState(() => ({
    meetingId: meeting?.id ?? "",
    notes: meeting?.notes ?? "",
    outcomes: meeting?.outcomes ?? "",
  }));

  if (meeting && draft.meetingId !== meeting.id) {
    setDraft({
      meetingId: meeting.id,
      notes: meeting.notes ?? "",
      outcomes: meeting.outcomes ?? "",
    });
  }

  function meetingHref(path: string) {
    return meeting ? `${path}?id=${encodeURIComponent(meeting.id)}` : path;
  }

  async function saveNotes() {
    if (!meeting) return;
    try {
      await updateMutation.mutateAsync({
        notes: draft.notes,
        outcomes: draft.outcomes,
      });
      showToast({ message: t("notesSaved"), tone: "success" });
      router.push(meetingHref("/meetings/research/summary"));
    } catch {
      showToast({ message: t("notesFailed"), tone: "error" });
    }
  }

  async function completeMeeting() {
    if (!meeting) return;
    try {
      await updateMutation.mutateAsync({
        notes: draft.notes,
        outcomes: draft.outcomes,
        status: MeetingStatus.Completed,
      });
      showToast({ message: t("completed"), tone: "success" });
      router.push(meetingHref("/meetings/research/feedback"));
    } catch {
      showToast({ message: t("completeFailed"), tone: "error" });
    }
  }

  return {
    completeMeeting,
    error: meetingsQuery.error ?? updateMutation.error,
    isLoading: meetingsQuery.isLoading,
    isSaving: updateMutation.isPending,
    meeting,
    meetingHref,
    notes: draft.notes,
    outcomes: draft.outcomes,
    saveNotes,
    setNotes: (notes: string) => setDraft((current) => ({ ...current, notes })),
    setOutcomes: (outcomes: string) =>
      setDraft((current) => ({ ...current, outcomes })),
  };
}

export function useMeetingFeedback(meetingId: string | null) {
  const t = useTranslations("meetingPages.feedback");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [draftRatings, setDraftRatings] = useState<number[]>(() =>
    MEETING_FEEDBACK_QUESTIONS.map(() => 0),
  );
  const [draftBenefits, setDraftBenefits] = useState<Set<string>>(
    () => new Set(),
  );
  const [draftNote, setDraftNote] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const existingFeedbackQuery = useQuery({
    queryKey: ["meeting-feedback", meetingId],
    queryFn: () => getMeetingFeedback(meetingId!),
    enabled: Boolean(meetingId),
  });

  const existing = existingFeedbackQuery.data;
  const existingView = useMemo(() => {
    if (!existing) return null;
    const { nextMeetingNote, selected } = splitFeedbackBenefits(
      existing.benefits,
    );
    return {
      nextMeetingNote,
      ratings: MEETING_FEEDBACK_QUESTIONS.map(
        (_, index) => existing.ratings[index] ?? 0,
      ),
      selectedBenefits: new Set(selected),
    };
  }, [existing]);

  const hasExistingFeedback = Boolean(existing);
  const locked = hasExistingFeedback || justSubmitted;
  const ratings = existingView?.ratings ?? draftRatings;
  const selectedBenefits = existingView?.selectedBenefits ?? draftBenefits;
  const nextMeetingNote = existingView?.nextMeetingNote ?? draftNote;

  function rate(questionIndex: number, value: number) {
    if (locked) return;
    setDraftRatings((current) =>
      current.map((rating, index) =>
        index === questionIndex ? value : rating,
      ),
    );
  }

  function toggleBenefit(benefit: string) {
    if (locked) return;
    setDraftBenefits((current) => {
      const next = new Set(current);
      if (next.has(benefit)) next.delete(benefit);
      else next.add(benefit);
      return next;
    });
  }

  const canSubmit =
    !locked && ratings.every((rating) => rating > 0) && !submitting;

  async function submit() {
    if (!canSubmit) return;
    if (!meetingId) {
      setSubmitError(t("noMeeting"));
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const benefits = [...selectedBenefits];
      const note = nextMeetingNote.trim();
      if (note) benefits.push(note);
      await postMeetingFeedback(meetingId, {
        ratings,
        benefits,
      });
      setJustSubmitted(true);
      await queryClient.invalidateQueries({
        queryKey: ["meeting-feedback", meetingId],
      });
      await queryClient.invalidateQueries({
        queryKey: RATED_MEETINGS_QUERY_KEY,
      });
      showToast({ message: t("sentToast"), tone: "success" });
    } catch {
      setSubmitError(t("saveFailed"));
      showToast({
        message: t("saveFailed"),
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    canSubmit,
    isFeedbackLoading: existingFeedbackQuery.isLoading,
    nextMeetingNote,
    rate,
    ratings,
    readOnly: hasExistingFeedback,
    selectedBenefits,
    setNextMeetingNote: (value: string) => {
      if (locked) return;
      setDraftNote(value);
    },
    submit,
    submitError,
    submitted: justSubmitted,
    submitting,
    toggleBenefit,
  };
}
