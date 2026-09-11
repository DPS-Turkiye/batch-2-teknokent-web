"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";

import {
  useMentorAvailability,
  useMentorRequestDecision,
} from "@/hooks/use-mentorship-requests";
import {
  MentorDecisionMode,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { formatSlotDateTime } from "@/lib/format";

const decisionStatuses: Record<MentorDecisionMode, MentorshipRequestStatus> = {
  [MentorDecisionMode.Accept]: MentorshipRequestStatus.Accepted,
  [MentorDecisionMode.AskInfo]: MentorshipRequestStatus.MoreInfoRequested,
  [MentorDecisionMode.Decline]: MentorshipRequestStatus.Declined,
};

export function useDecision() {
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
  const availabilityQuery = useMentorAvailability(
    selectedRequest?.id ?? null,
    showAvailabilityStep,
  );
  const selectedSlots = (availabilityQuery.data ?? []).map((slot) =>
    formatSlotDateTime(slot.startsAt),
  );

  function selectRequest(request: MentorshipRequest) {
    setSelectedRequest(request);
    setDecisionMode(null);
    setShowAvailabilityStep(false);
  }

  function closeDecision() {
    setSelectedRequest(null);
    setDecisionMode(null);
    setDecisionMessage("");
    setActionError("");
    setShowAvailabilityStep(false);
  }

  async function submitDecision(mode?: MentorDecisionMode) {
    const activeMode = mode ?? decisionMode;
    if (!selectedRequest || !activeMode) return false;
    setActionError("");

    try {
      await decisionMutation.mutateAsync({
        id: selectedRequest.id,
        status: decisionStatuses[activeMode],
        message:
          decisionMessage ||
          (activeMode === MentorDecisionMode.Accept
            ? "Talebiniz kabul edildi."
            : "Detaylı bilgi rica ederim."),
      });

      if (activeMode === MentorDecisionMode.Accept) {
        showToast({
          message: "Mentorluk talebi kabul edildi.",
          tone: "success",
        });
        setShowAvailabilityStep(true);
      } else {
        showToast({ message: "Mentorluk talebi yanıtlandı.", tone: "success" });
        closeDecision();
      }
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "İşlem tamamlanamadı.",
      );
      showToast({ message: "Mentorluk talebi yanıtlanamadı.", tone: "error" });
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
    isLoadingSlots: availabilityQuery.isLoading,
    isPending: decisionMutation.isPending,
    selectRequest,
    setDecisionMode,
    setDecisionMessage,
    closeDecision,
    submitDecision,
  };
}
