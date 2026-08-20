"use client";

import { useState } from "react";

import {
  useCreateMentorAvailabilitySlot,
  useDeleteMentorAvailabilitySlot,
  useOwnMentorAvailability,
} from "@/hooks/use-mentor-availability";

export function useAvailabilitySlot(mentorId: string | null) {
  const availabilityQuery = useOwnMentorAvailability(mentorId);
  const createMutation = useCreateMentorAvailabilitySlot(mentorId);
  const deleteMutation = useDeleteMentorAvailabilitySlot(mentorId);
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState("");

  async function addSlot() {
    if (!startsAt) return;
    setError("");
    try {
      await createMutation.mutateAsync({
        startsAt: new Date(startsAt).toISOString(),
      });
      setStartsAt("");
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Zaman dilimi eklenemedi.",
      );
    }
  }

  async function removeSlot(slotId: string) {
    setError("");
    try {
      await deleteMutation.mutateAsync(slotId);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Zaman dilimi kaldırılamadı.",
      );
    }
  }

  return {
    availabilityQuery,
    startsAt,
    setStartsAt,
    error,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    addSlot,
    removeSlot,
  };
}
