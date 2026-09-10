"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { useToast } from "@/components/providers/toast-provider";
import { useMeetings, useUpdateMeeting } from "@/hooks/use-meetings";
import { postMeetingFeedback } from "@/lib/client/meetings";
import { MEETING_FEEDBACK_QUESTIONS } from "@/lib/const";

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

export function useMeetingLifecycle() {
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
      showToast({ message: "Görüşme notları kaydedildi.", tone: "success" });
      router.push(meetingHref("/meetings/research/summary"));
    } catch {
      showToast({ message: "Görüşme notları kaydedilemedi.", tone: "error" });
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
      showToast({ message: "Görüşme tamamlandı.", tone: "success" });
      router.push(meetingHref("/meetings/research/feedback"));
    } catch {
      showToast({ message: "Görüşme tamamlanamadı.", tone: "error" });
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

export function useMeetingFeedback() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const meetingId = searchParams.get("id");
  // Ratings track the questions the page renders; 0 means "not answered yet",
  // so nothing is submitted on the user's behalf.
  const [ratings, setRatings] = useState<number[]>(() =>
    MEETING_FEEDBACK_QUESTIONS.map(() => 0),
  );
  const [selectedBenefits, setSelectedBenefits] = useState<Set<string>>(
    () => new Set(),
  );
  const [nextMeetingNote, setNextMeetingNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function rate(questionIndex: number, value: number) {
    setRatings((current) =>
      current.map((rating, index) =>
        index === questionIndex ? value : rating,
      ),
    );
  }

  function toggleBenefit(benefit: string) {
    setSelectedBenefits((current) => {
      const next = new Set(current);
      if (next.has(benefit)) next.delete(benefit);
      else next.add(benefit);
      return next;
    });
  }

  const canSubmit = ratings.every((rating) => rating > 0) && !submitting;

  async function submit() {
    if (!canSubmit) return;
    if (!meetingId) {
      setSubmitError("Değerlendirilecek toplantı bulunamadı.");
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
      setSubmitted(true);
      showToast({ message: "Değerlendirmen gönderildi.", tone: "success" });
    } catch {
      setSubmitError("Değerlendirme kaydedilemedi. Lütfen tekrar deneyin.");
      showToast({
        message: "Değerlendirme kaydedilemedi. Lütfen tekrar deneyin.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return {
    canSubmit,
    nextMeetingNote,
    rate,
    ratings,
    selectedBenefits,
    setNextMeetingNote,
    submit,
    submitError,
    submitted,
    submitting,
    toggleBenefit,
  };
}
