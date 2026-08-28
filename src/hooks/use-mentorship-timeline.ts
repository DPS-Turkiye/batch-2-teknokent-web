"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  getMentorshipMeetings,
  logMentorshipMeeting,
  type LogMeetingPayload,
} from "@/lib/client/mentor-requests";
import {
  updateMeeting,
  type UpdateMeetingPayload,
} from "@/lib/client/meetings";
import { toDateTimeLocalValue } from "@/lib/utils";

export const mentorshipMeetingsQueryKey = (requestId: string) =>
  ["mentorship-meetings", requestId] as const;

export function useMentorshipMeetings(requestId: string | null) {
  return useQuery({
    queryKey: mentorshipMeetingsQueryKey(requestId ?? ""),
    queryFn: () => getMentorshipMeetings(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useLogMeeting(requestId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogMeetingPayload) =>
      logMentorshipMeeting(requestId as string, payload),
    onSuccess: () => {
      if (!requestId) return;
      return queryClient.invalidateQueries({
        queryKey: mentorshipMeetingsQueryKey(requestId),
      });
    },
  });
}

export function useUpdateMeeting(requestId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: { id: string; payload: UpdateMeetingPayload }) =>
      updateMeeting(options.id, options.payload),
    onSuccess: () => {
      if (!requestId) return;
      return queryClient.invalidateQueries({
        queryKey: mentorshipMeetingsQueryKey(requestId),
      });
    },
  });
}

export function useMeetingNoteForm(
  requestId: string | null,
  meeting: MeetingItem,
) {
  const updateMeetingMutation = useUpdateMeeting(requestId);
  const [notes, setNotes] = useState(meeting.notes ?? "");
  const [outcomes, setOutcomes] = useState(meeting.outcomes ?? "");
  const [status, setStatus] = useState<MeetingStatus>(
    (meeting.status as MeetingStatus) ?? MeetingStatus.Scheduled,
  );

  const handleSave = () =>
    updateMeetingMutation.mutateAsync({
      id: meeting.id,
      payload: { notes, outcomes, status },
    });

  return {
    notes,
    setNotes,
    outcomes,
    setOutcomes,
    status,
    setStatus,
    handleSave,
    isSaving: updateMeetingMutation.isPending,
  };
}

function emptyLogForm() {
  return {
    scheduledAt: toDateTimeLocalValue(new Date()),
    durationMinutes: 60,
    agenda: "",
    notes: "",
    status: MeetingStatus.Completed,
  };
}

export function useLogMeetingForm(
  requestId: string | null,
  mentorId: string | null,
) {
  const logMeetingMutation = useLogMeeting(requestId);
  const [form, setForm] = useState(emptyLogForm);
  const [logError, setLogError] = useState("");

  const updateForm = (patch: Partial<ReturnType<typeof emptyLogForm>>) => {
    setForm((previous) => ({ ...previous, ...patch }));
  };

  const resetForm = () => setForm(emptyLogForm());

  const handleLogMeeting = async () => {
    if (!mentorId) return;
    setLogError("");
    try {
      await logMeetingMutation.mutateAsync({
        mentorId,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        agenda: form.agenda || undefined,
        notes: form.notes || undefined,
        status: form.status,
      });
      setForm((previous) => ({ ...previous, agenda: "", notes: "" }));
    } catch (error) {
      setLogError(
        error instanceof Error ? error.message : "Could not save the meeting.",
      );
    }
  };

  return {
    form,
    logError,
    isLogging: logMeetingMutation.isPending,
    updateForm,
    resetForm,
    handleLogMeeting,
  };
}
