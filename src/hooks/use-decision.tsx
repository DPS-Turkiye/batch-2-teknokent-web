"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  useMentorAvailability,
  useMentorRequestDecision,
} from "@/hooks/use-mentorship-requests";
import {
  MentorDecisionMode,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { ToastTone } from "@/interfaces/toast";
import { MENTORSHIP_MEETING_DURATION_MINUTES } from "@/lib/const";
import { MENTOR_ACCEPT_MESSAGE } from "@/lib/const/mentorships";
import { formatSlotDateTime } from "@/lib/format";
import {
  chosenSlotDecisionMessage,
  decisionSlotOptions,
  isUpcomingSlot,
} from "@/lib/mentor-availability-days";
import { useToast } from "@/stores/toast-store";

const decisionStatuses: Record<MentorDecisionMode, MentorshipRequestStatus> = {
  [MentorDecisionMode.Accept]: MentorshipRequestStatus.Accepted,
  [MentorDecisionMode.AskInfo]: MentorshipRequestStatus.MoreInfoRequested,
  [MentorDecisionMode.Decline]: MentorshipRequestStatus.Declined,
};

export function useDecision() {
  const t = useTranslations("mentorDecision");
  const locale = useLocale();
  const { showToast } = useToast();
  const decisionMutation = useMentorRequestDecision();
  const [selectedRequest, setSelectedRequest] =
    useState<MentorshipRequest | null>(null);
  const [decisionMode, setDecisionMode] = useState<MentorDecisionMode | null>(
    null,
  );
  const [decisionMessage, setDecisionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [showAvailabilityStep, setShowAvailabilityStep] = useState(false);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const slotOptions = useMemo(
    () =>
      selectedRequest
        ? decisionSlotOptions(
            selectedRequest.requesterMessage,
            MENTORSHIP_MEETING_DURATION_MINUTES,
            new Date(),
            locale,
          )
        : [],
    [selectedRequest, locale],
  );
  const selectedSlot =
    slotOptions.find(
      (option) => option.available && option.key === selectedSlotKey,
    ) ?? null;
  // While one of the mentee's times can still be booked, an accept must name it: an accept without a
  // time makes the backend book the first free one, so a mentor could end up with a time they never
  // picked. With none left, the backend books nothing and the meeting is planned later.
  const canAccept =
    !slotOptions.some((option) => option.available) || selectedSlot !== null;
  const availabilityQuery = useMentorAvailability(
    selectedRequest?.id ?? null,
    showAvailabilityStep,
  );
  const selectedSlots = (availabilityQuery.data ?? []).map((slot) =>
    formatSlotDateTime(slot.startsAt, locale),
  );

  function selectRequest(request: MentorshipRequest) {
    setSelectedRequest(request);
    setDecisionMode(null);
    setShowAvailabilityStep(false);
    setSelectedSlotKey(null);
  }

  function closeDecision() {
    setSelectedRequest(null);
    setDecisionMode(null);
    setDecisionMessage("");
    setActionError("");
    setShowAvailabilityStep(false);
    setSelectedSlotKey(null);
  }

  async function submitDecision(mode?: MentorDecisionMode) {
    const activeMode = mode ?? decisionMode;
    if (!selectedRequest || !activeMode) return false;
    const accepting = activeMode === MentorDecisionMode.Accept;
    // The drawer can stay open while a picked time starts, so check it again at send time.
    if (accepting && !canAccept) return false;
    if (
      accepting &&
      selectedSlot &&
      !isUpcomingSlot(selectedSlot.slot, new Date())
    ) {
      setActionError(t("slotPassed"));
      return false;
    }
    setActionError("");

    try {
      await decisionMutation.mutateAsync({
        id: selectedRequest.id,
        status: decisionStatuses[activeMode],
        message:
          accepting && selectedSlot
            ? chosenSlotDecisionMessage(selectedSlot.slot)
            : decisionMessage ||
              (accepting
                ? MENTOR_ACCEPT_MESSAGE
                : "Detaylı bilgi rica ederim."),
      });

      if (accepting) {
        showToast({
          message: t("accepted"),
          tone: ToastTone.Success,
        });
        setShowAvailabilityStep(true);
      } else {
        showToast({ message: t("answered"), tone: ToastTone.Success });
        closeDecision();
      }
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t("failed"));
      showToast({ message: t("answerFailed"), tone: ToastTone.Error });
      return false;
    }
  }

  return {
    selectedRequest,
    decisionMode,
    decisionMessage,
    actionError,
    showAvailabilityStep,
    selectedSlots,
    slotOptions,
    selectedSlot,
    selectSlot: setSelectedSlotKey,
    canAccept,
    isLoadingSlots: availabilityQuery.isLoading,
    isPending: decisionMutation.isPending,
    selectRequest,
    setDecisionMode,
    setDecisionMessage,
    closeDecision,
    submitDecision,
  };
}
