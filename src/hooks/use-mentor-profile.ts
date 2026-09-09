"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";

import type {
  MentorProfile,
  UpdateMentorProfilePayload,
} from "@/interfaces/mentor";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getMentorAvailability,
  getMentorProfile,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import { toDateTimeLocalValue } from "@/lib/utils";

export const MENTOR_PROFILE_QUERY_KEY = ["mentor-profile"] as const;
export const MENTOR_AVAILABILITY_QUERY_KEY = [
  "mentor-profile",
  "availability",
] as const;

export function useMentorProfile() {
  return useQuery({
    queryKey: MENTOR_PROFILE_QUERY_KEY,
    queryFn: getMentorProfile,
  });
}

export function useUpdateMentorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMentorProfilePayload) =>
      updateMentorProfile(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MENTOR_PROFILE_QUERY_KEY }),
  });
}

export function useMentorAvailabilitySlots() {
  return useQuery({
    queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
    queryFn: getMentorAvailability,
  });
}

export function useCreateAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvailabilitySlot,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
      }),
  });
}

export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvailabilitySlot,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
      }),
  });
}

function toEditablePayload(profile: MentorProfile): UpdateMentorProfilePayload {
  return {
    professionalTitle: profile.professionalTitle,
    company: profile.company,
    availabilityLabel: profile.availabilityLabel,
    responseTimeLabel: profile.responseTimeLabel,
    meetingMode: profile.meetingMode,
    communicationPreference: profile.communicationPreference,
    mentoringStyle: profile.mentoringStyle,
    fitLabel: profile.fitLabel,
    experienceLevel: profile.experienceLevel,
    sectorExperience: profile.sectorExperience,
    startupStages: profile.startupStages,
    specialties: profile.specialties,
  };
}

export function useMentorProfileForm(profile: MentorProfile) {
  const { showToast } = useToast();
  const updateProfileMutation = useUpdateMentorProfile();
  const [form, setForm] = useState<UpdateMentorProfilePayload>(() =>
    toEditablePayload(profile),
  );
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateField = (
    key: keyof UpdateMentorProfilePayload,
    value: string,
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (!value || form.specialties.includes(value)) return;
    setForm((previous) => ({
      ...previous,
      specialties: [...previous.specialties, value],
    }));
    setSpecialtyInput("");
  };

  const removeSpecialty = (value: string) => {
    setForm((previous) => ({
      ...previous,
      specialties: previous.specialties.filter((item) => item !== value),
    }));
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateProfileMutation.mutateAsync(form);
      setSaveSuccess(true);
      showToast({ message: "Mentor profiliniz kaydedildi.", tone: "success" });
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Profil kaydedilemedi.",
      );
      showToast({ message: "Mentor profili kaydedilemedi.", tone: "error" });
    }
  };

  return {
    form,
    specialtyInput,
    setSpecialtyInput,
    saveError,
    saveSuccess,
    isSaving: updateProfileMutation.isPending,
    updateField,
    addSpecialty,
    removeSpecialty,
    handleSave,
  };
}

function defaultSlotStart() {
  return toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

export function useAvailabilitySlotForm() {
  const { showToast } = useToast();
  const createSlotMutation = useCreateAvailabilitySlot();
  const deleteSlotMutation = useDeleteAvailabilitySlot();
  const [slotForm, setSlotForm] = useState({
    startsAt: defaultSlotStart(),
    durationMinutes: 60,
  });
  const [slotError, setSlotError] = useState("");

  const handleAddSlot = async () => {
    setSlotError("");
    try {
      await createSlotMutation.mutateAsync({
        startsAt: new Date(slotForm.startsAt).toISOString(),
        durationMinutes: slotForm.durationMinutes,
      });
      setSlotForm({
        startsAt: defaultSlotStart(),
        durationMinutes: 60,
      });
      showToast({ message: "Müsaitlik saati eklendi.", tone: "success" });
    } catch (error) {
      setSlotError(
        error instanceof Error ? error.message : "Müsaitlik saati eklenemedi.",
      );
      showToast({ message: "Müsaitlik saati eklenemedi.", tone: "error" });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlotMutation.mutateAsync(slotId);
      showToast({ message: "Müsaitlik saati silindi.", tone: "success" });
    } catch {
      showToast({ message: "Müsaitlik saati silinemedi.", tone: "error" });
    }
  };

  return {
    slotForm,
    setSlotForm,
    slotError,
    isCreating: createSlotMutation.isPending,
    isDeleting: deleteSlotMutation.isPending,
    handleAddSlot,
    handleDeleteSlot,
  };
}
