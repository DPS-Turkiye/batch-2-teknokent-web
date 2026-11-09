"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import {
  useCreateOfficeHoursRequest,
  useInstructorSlots,
} from "@/hooks/use-office-hours-booking";
import type { OfficeHoursPerson } from "@/interfaces/office-hours";
import {
  emptyPreferredSlots,
  hasPreferredSlots,
  isValidPreferredSlot,
  preferredSlotMachineValue,
} from "@/lib/mentor-availability-days";
import { asAvailabilitySlots } from "@/lib/office-hours-booking";
import { errorMessage } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

export function useOfficeHoursRequestForm(
  courseId: string,
  instructor: OfficeHoursPerson,
  onSent: () => void,
) {
  const t = useTranslations("officeHours.booking.dialog");
  const { showToast } = useToast();
  const slotsQuery = useInstructorSlots(courseId, instructor.id);
  const createRequest = useCreateOfficeHoursRequest(courseId);
  const [topic, setTopic] = useState("");
  const [outcome, setOutcome] = useState("");
  const [preferredSlots, setPreferredSlots] = useState(emptyPreferredSlots);
  const [error, setError] = useState("");

  function problem() {
    if (!topic.trim()) return t("needTopic");
    if (!hasPreferredSlots(preferredSlots)) return t("needSlots");
    return "";
  }

  async function send() {
    const found = problem();
    setError(found);
    if (found) return;
    try {
      await createRequest.mutateAsync({
        instructorId: instructor.id,
        topic: topic.trim(),
        expectedOutcome: outcome.trim() || undefined,
        preferredSlots: preferredSlots
          .filter(isValidPreferredSlot)
          .map(preferredSlotMachineValue),
      });
      showToast({ message: t("sent"), tone: ToastTone.Success });
      onSent();
    } catch (sendError) {
      setError(errorMessage(sendError, t("needSlots")));
    }
  }

  return {
    topic,
    setTopic,
    outcome,
    setOutcome,
    preferredSlots,
    setPreferredSlots,
    slots: asAvailabilitySlots(slotsQuery.data ?? []),
    error,
    isSending: createRequest.isPending,
    send,
  };
}
