"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { useMeetings, useUpdateMeeting } from "@/hooks/use-meetings";

const fallbackMeeting: MeetingItem = {
  id: "preview-meeting",
  organizationId: "preview-organization",
  scheduledAt: "2026-09-01T15:00:00+03:00",
  durationMinutes: 45,
  agenda: "Financial Planning & Business Model",
  notes: "Pricing için tek model yerine iki senaryo test edilecek.",
  outcomes: "İlk finansal model 12 aylık hazırlanacak.",
  meetLink: "",
  status: MeetingStatus.Scheduled,
};

export const MEETING_ACTIONS = [
  "Aylık sabit giderleri çıkar",
  "3 pricing senaryosu oluştur",
  "12 aylık runway hesapla",
  "Modeli mentorla paylaş",
] as const;

function chooseMeeting(meetings: MeetingItem[], requestedId: string | null) {
  if (requestedId) {
    const requested = meetings.find((meeting) => meeting.id === requestedId);
    if (requested) return requested;
  }
  return (
    meetings.find((meeting) => meeting.status === MeetingStatus.Scheduled) ??
    meetings[0] ??
    fallbackMeeting
  );
}

export function useMeetingLifecycle() {
  const router = useRouter();
  const params = useSearchParams();
  const meetingsQuery = useMeetings();
  const meeting = useMemo(
    () => chooseMeeting(meetingsQuery.data ?? [], params.get("id")),
    [meetingsQuery.data, params],
  );
  const isPreviewData = meeting.id === fallbackMeeting.id;
  const updateMutation = useUpdateMeeting(
    isPreviewData ? undefined : meeting.id,
  );
  const [draft, setDraft] = useState(() => ({
    meetingId: meeting.id,
    notes: meeting.notes ?? "",
    outcomes: meeting.outcomes ?? "",
  }));
  const [completedActions, setCompletedActions] = useState<Set<string>>(
    () => new Set(),
  );

  if (draft.meetingId !== meeting.id) {
    setDraft({
      meetingId: meeting.id,
      notes: meeting.notes ?? "",
      outcomes: meeting.outcomes ?? "",
    });
  }

  function meetingHref(path: string) {
    return isPreviewData
      ? path
      : `${path}?id=${encodeURIComponent(meeting.id)}`;
  }

  async function saveNotes() {
    if (!isPreviewData) {
      await updateMutation.mutateAsync({
        notes: draft.notes,
        outcomes: draft.outcomes,
      });
    }
    router.push(meetingHref("/meetings/research/summary"));
  }

  async function completeMeeting() {
    if (!isPreviewData) {
      await updateMutation.mutateAsync({
        notes: draft.notes,
        outcomes: draft.outcomes,
        status: MeetingStatus.Completed,
      });
    }
    router.push(meetingHref("/meetings/research/feedback"));
  }

  function toggleAction(action: string) {
    setCompletedActions((current) => {
      const next = new Set(current);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  return {
    completedActions,
    completeMeeting,
    error: meetingsQuery.error ?? updateMutation.error,
    isLoading: meetingsQuery.isLoading,
    isPreviewData,
    isSaving: updateMutation.isPending,
    meeting,
    meetingHref,
    notes: draft.notes,
    outcomes: draft.outcomes,
    saveNotes,
    setNotes: (notes: string) => setDraft((current) => ({ ...current, notes })),
    setOutcomes: (outcomes: string) =>
      setDraft((current) => ({ ...current, outcomes })),
    toggleAction,
  };
}

export function useMeetingFeedback() {
  const [ratings, setRatings] = useState([4, 4, 5, 5]);
  const [selectedBenefits, setSelectedBenefits] = useState(
    () => new Set(["Finansal modeli anlamak", "Somut aksiyonlar belirlemek"]),
  );
  const [submitted, setSubmitted] = useState(false);

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

  return {
    rate,
    ratings,
    selectedBenefits,
    submit: () => setSubmitted(true),
    submitted,
    toggleBenefit,
  };
}
