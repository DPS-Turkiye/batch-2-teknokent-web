"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { useToast } from "@/stores/toast-store";
import {
  MAX_PROPOSED_TIMES,
  OfficeHoursRequestAction,
  type OfficeHoursAnswer,
  type OfficeHoursRequest,
} from "@/interfaces/academician-office-hours";
import { AppointmentStatus } from "@/interfaces/appointment";
import {
  answerAcademicianRequest,
  getAcademicianRequests,
} from "@/lib/client/academician-office-hours";
import {
  ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  rangeMinutes,
  turkeyTimeRange,
} from "@/lib/academician-office-hours";
import { ToastTone } from "@/interfaces/toast";

export const ACADEMICIAN_REQUESTS_QUERY_KEY = [
  ...ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  "requests",
] as const;

const DONE_MESSAGE = {
  [OfficeHoursRequestAction.Accept]: "accepted",
  [OfficeHoursRequestAction.Decline]: "declined",
  [OfficeHoursRequestAction.ProposeTimes]: "proposed",
  [OfficeHoursRequestAction.AskQuestion]: "asked",
} as const;

type OpenForm = { id: string; action: OfficeHoursRequestAction };

/** The academician answers it now: pending and not waiting on a question to the student. */
export function waitsForAcademician(request: OfficeHoursRequest) {
  return (
    request.status === AppointmentStatus.Pending &&
    !request.awaitingStudentReply
  );
}

/** Randevu Talepleri: open requests and the answers each request's source allows. */
export function useAcademicianRequests() {
  const t = useTranslations("academicianWorkspace.requests");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ACADEMICIAN_REQUESTS_QUERY_KEY,
    queryFn: getAcademicianRequests,
  });
  const [form, setForm] = useState<OpenForm | null>(null);
  const [pickedTime, setPickedTime] = useState("");
  const [reason, setReason] = useState("");
  const [proposedTimes, setProposedTimes] = useState<string[]>([""]);
  const [question, setQuestion] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sorted = (query.data ?? []).toSorted(
    (a, b) =>
      Date.parse(a.requestedTimes[0]?.startsAt ?? a.requestedAt) -
      Date.parse(b.requestedTimes[0]?.startsAt ?? b.requestedAt),
  );

  const answer = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: OfficeHoursAnswer }) =>
      answerAcademicianRequest(id, reply),
    onSuccess: (_, { reply }) => {
      void queryClient.invalidateQueries({
        queryKey: ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
      });
      showToast({
        message: t(DONE_MESSAGE[reply.action]),
        tone: ToastTone.Success,
      });
      setForm(null);
    },
    onError: () => {
      // Usually the student withdrew or the request changed meanwhile: show the current list.
      void query.refetch();
      showToast({ message: t("failed"), tone: ToastTone.Error });
      setForm(null);
    },
  });

  const open = (
    request: OfficeHoursRequest,
    action: OfficeHoursRequestAction,
  ) => {
    setForm({ id: request.id, action });
    setPickedTime(
      request.requestedTimes.length === 1
        ? request.requestedTimes[0].startsAt
        : "",
    );
    setReason("");
    setProposedTimes([""]);
    setQuestion("");
    setFormError(null);
  };

  const replyFor = (
    request: OfficeHoursRequest,
  ): OfficeHoursAnswer | string => {
    switch (form?.action) {
      case OfficeHoursRequestAction.Accept: {
        const time = request.requestedTimes.find(
          (item) => item.startsAt === pickedTime,
        );
        return time ? { action: form.action, time } : t("pickOne");
      }
      case OfficeHoursRequestAction.Decline:
        return { action: form.action, reason: reason.trim() || null };
      case OfficeHoursRequestAction.ProposeTimes: {
        const minutes = rangeMinutes(request.requestedTimes[0]);
        const times = proposedTimes
          .filter(Boolean)
          .map((local) => turkeyTimeRange(local, minutes));
        if (!times.length) return t("needTime");
        if (times.some((time) => Date.parse(time.startsAt) <= Date.now())) {
          return t("proposedPast");
        }
        return { action: form.action, times, note: null };
      }
      case OfficeHoursRequestAction.AskQuestion:
        return question.trim()
          ? { action: form.action, question: question.trim() }
          : t("needQuestion");
      default:
        return t("needTime");
    }
  };

  const submit = (request: OfficeHoursRequest) => (event: FormEvent) => {
    event.preventDefault();
    const reply = replyFor(request);
    if (typeof reply === "string") {
      setFormError(reply);
      return;
    }
    answer.mutate({ id: request.id, reply });
  };

  return {
    waitingForYou: sorted.filter(waitsForAcademician),
    waitingForStudent: sorted.filter(
      (request) => !waitsForAcademician(request),
    ),
    isEmpty: query.data?.length === 0,
    isLoading: query.isLoading,
    error: query.error,
    retry: () => void query.refetch(),
    isRetrying: query.isFetching,
    form,
    open,
    close: () => setForm(null),
    submit,
    isAnswering: answer.isPending,
    formError,
    pickedTime,
    setPickedTime,
    reason,
    setReason,
    question,
    setQuestion,
    proposedTimes,
    setProposedTime: (index: number, value: string) =>
      setProposedTimes((current) =>
        current.map((item, at) => (at === index ? value : item)),
      ),
    addProposedTime: () =>
      setProposedTimes((current) =>
        current.length < MAX_PROPOSED_TIMES ? [...current, ""] : current,
      ),
    canAddProposedTime: proposedTimes.length < MAX_PROPOSED_TIMES,
  };
}

export type AcademicianRequestsState = ReturnType<
  typeof useAcademicianRequests
>;
