"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import {
  useInstructorSlots,
  useOfficeHoursRequestAction,
} from "@/hooks/use-office-hours-booking";
import {
  DECIDABLE_OFFICE_HOURS_REQUEST_STATUSES,
  OfficeHoursMessageType,
  OfficeHoursRequestStatus,
  OfficeHoursRole,
  OPEN_OFFICE_HOURS_REQUEST_STATUSES,
  type OfficeHoursRequest,
} from "@/interfaces/office-hours";
import type { OfficeHoursRequestAction } from "@/lib/client/office-hours-booking";
import {
  emptyPreferredSlots,
  hasPreferredSlots,
  isValidPreferredSlot,
  preferredSlotMachineValue,
} from "@/lib/mentor-availability-days";
import { asAvailabilitySlots, counterpartOf } from "@/lib/office-hours-booking";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

export type DecisionMode = "accept" | "decline" | "question" | "propose";

export function useOfficeHoursRequestCard(
  request: OfficeHoursRequest,
  viewer: OfficeHoursRole,
) {
  const t = useTranslations("officeHours.booking");
  const { showToast } = useToast();
  const act = useOfficeHoursRequestAction(request.courseId);
  const [mode, setMode] = useState<DecisionMode | null>(null);
  const [text, setText] = useState("");
  const [acceptSlot, setAcceptSlot] = useState(request.preferredSlots[0] ?? "");
  const [proposed, setProposed] = useState(emptyPreferredSlots);
  const [error, setError] = useState("");
  const instructor = viewer === OfficeHoursRole.Instructor;
  // Only the academic proposing other times needs their free slots, so nothing is fetched until then.
  const ownSlots = useInstructorSlots(
    request.courseId,
    instructor && mode === "propose" ? request.instructor.id : null,
  );
  const question = request.messages.findLast(
    (message) => message.type === OfficeHoursMessageType.InstructorQuestion,
  );

  const can = {
    decide:
      instructor && DECIDABLE_OFFICE_HOURS_REQUEST_STATUSES.has(request.status),
    withdraw:
      !instructor && OPEN_OFFICE_HOURS_REQUEST_STATUSES.has(request.status),
    takeProposed:
      !instructor &&
      request.status === OfficeHoursRequestStatus.CounterProposed,
    reply:
      !instructor &&
      request.status === OfficeHoursRequestStatus.MoreInfoRequested &&
      question !== undefined,
  };

  function close() {
    setMode(null);
    setError("");
  }

  async function run(action: OfficeHoursRequestAction) {
    setError("");
    try {
      await act.mutateAsync({ requestId: request.id, action });
      setMode(null);
      setText("");
      showToast({ message: t("done"), tone: ToastTone.Success });
    } catch (actionError) {
      setError(errorMessage(actionError, t("failed")));
    }
  }

  function decision(): OfficeHoursRequestAction | { problem: string } | null {
    const message = text.trim() || undefined;
    switch (mode) {
      case "accept":
        return {
          kind: "decision",
          payload: {
            status: OfficeHoursRequestStatus.Accepted,
            slot: acceptSlot,
            message,
          },
        };
      case "decline":
        return {
          kind: "decision",
          payload: { status: OfficeHoursRequestStatus.Declined, message },
        };
      case "question":
        if (!message) return null;
        return {
          kind: "decision",
          payload: {
            status: OfficeHoursRequestStatus.MoreInfoRequested,
            message,
          },
        };
      case "propose":
        if (!hasPreferredSlots(proposed)) return { problem: t("proposeHint") };
        return {
          kind: "decision",
          payload: {
            status: OfficeHoursRequestStatus.CounterProposed,
            proposedSlots: proposed
              .filter(isValidPreferredSlot)
              .map(preferredSlotMachineValue),
            message,
          },
        };
      case null:
        return null;
    }
  }

  function submitDecision() {
    const answer = decision();
    if (answer === null) return;
    if ("problem" in answer) {
      setError(answer.problem);
      return;
    }
    void run(answer);
  }

  return {
    other: counterpartOf(viewer, request),
    question,
    can,
    mode,
    open: setMode,
    close,
    text,
    setText,
    acceptSlot,
    setAcceptSlot,
    proposed,
    setProposed,
    ownSlots: asAvailabilitySlots(ownSlots.data ?? []),
    error,
    isPending: act.isPending,
    submitDecision,
    withdraw: () => run({ kind: "withdraw" }),
    takeProposed: (slot: string) =>
      run({ kind: "accept-proposed", payload: { slot } }),
    reply: () => run({ kind: "reply", payload: { message: text.trim() } }),
  };
}

export type OfficeHoursRequestCardState = ReturnType<
  typeof useOfficeHoursRequestCard
>;
