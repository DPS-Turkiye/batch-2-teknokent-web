"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/providers/toast-provider";

import type {
  MentorExperienceInput,
  MentorProfile,
  UpdateMentorAvailabilitySettingsPayload,
  UpdateMentorProfilePayload,
  Weekday,
} from "@/interfaces/mentor";
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/interfaces/mentor";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getMentorAvailability,
  getMentorProfile,
  updateMentorProfile,
  getAvailabilitySettings,
  updateAvailabilitySettings,
} from "@/lib/client/mentor-profile";
import {
  type AvailabilityDraft,
  type AvailabilityNumberField,
  availabilityDraftError,
  DEFAULT_RANGE,
  EMPTY_EXCEPTION_INPUT,
  exceptionError,
  type ExceptionInput,
  nextRangeAfter,
  rangesForDay,
  toAvailabilityDraft,
  toAvailabilityPayload,
} from "@/lib/mentor-availability";
import { toDateTimeLocalValue } from "@/lib/utils";

export const MENTOR_PROFILE_QUERY_KEY = ["mentor-profile"] as const;
export const MENTOR_AVAILABILITY_QUERY_KEY = [
  "mentor-profile",
  "availability",
] as const;
export const MENTOR_AVAILABILITY_SETTINGS_QUERY_KEY = [
  "mentor-profile",
  "availability-settings",
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

export function useMentorAvailabilitySettings() {
  return useQuery({
    queryKey: MENTOR_AVAILABILITY_SETTINGS_QUERY_KEY,
    queryFn: getAvailabilitySettings,
  });
}

export function useUpdateMentorAvailabilitySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMentorAvailabilitySettingsPayload) =>
      updateAvailabilitySettings(payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: MENTOR_AVAILABILITY_SETTINGS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: MENTOR_AVAILABILITY_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: MENTOR_PROFILE_QUERY_KEY }),
      ]),
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

type MentorProfileForm = Required<UpdateMentorProfilePayload>;

function toEditablePayload(profile: MentorProfile): MentorProfileForm {
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
    menteeCapacity: profile.menteeCapacity ?? null,
    experiences: (profile.experiences ?? []).map((experience) => ({
      title: experience.title,
      organization: experience.organization ?? "",
      period: experience.period ?? "",
      summary: experience.summary ?? "",
    })),
    about: profile.about ?? "",
  };
}

const MAX_EXPERIENCES = 10;
const EMPTY_EXPERIENCE: MentorExperienceInput = {
  title: "",
  organization: "",
  period: "",
  summary: "",
};

function isBlankExperience(experience: MentorExperienceInput) {
  return Object.values(experience).every((value) => !value.trim());
}

/** The first problem that would make the backend refuse the save, or "". */
export function mentorProfileFormError(form: MentorProfileForm) {
  const capacity = form.menteeCapacity;
  if (
    capacity !== null &&
    (!Number.isInteger(capacity) || capacity < 1 || capacity > 50)
  ) {
    return "Mentee kapasitesi 1 ile 50 arasında olmalı.";
  }
  if (
    form.experiences.some(
      (experience) =>
        !isBlankExperience(experience) && !experience.title.trim(),
    )
  ) {
    return "Her deneyim için bir ünvan gir.";
  }
  return "";
}

export function useMentorProfileForm(profile: MentorProfile) {
  const { showToast } = useToast();
  const updateProfileMutation = useUpdateMentorProfile();
  const [form, setForm] = useState<MentorProfileForm>(() =>
    toEditablePayload(profile),
  );
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const updateField = (
    key: Exclude<
      keyof UpdateMentorProfilePayload,
      "specialties" | "menteeCapacity" | "experiences"
    >,
    value: string,
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateCapacity = (value: string) => {
    setForm((previous) => ({
      ...previous,
      menteeCapacity: value.trim() ? Number(value) : null,
    }));
  };

  const addExperience = () => {
    setForm((previous) =>
      previous.experiences.length >= MAX_EXPERIENCES
        ? previous
        : {
            ...previous,
            experiences: [...previous.experiences, EMPTY_EXPERIENCE],
          },
    );
  };

  const updateExperience = (
    index: number,
    field: keyof MentorExperienceInput,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.map((experience, position) =>
        position === index ? { ...experience, [field]: value } : experience,
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setForm((previous) => ({
      ...previous,
      experiences: previous.experiences.filter(
        (_, position) => position !== index,
      ),
    }));
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

  /** True once the backend has the profile, so callers can leave edit mode. */
  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    const problem = mentorProfileFormError(form);
    if (problem) {
      setSaveError(problem);
      return false;
    }
    try {
      await updateProfileMutation.mutateAsync({
        ...form,
        experiences: form.experiences.filter(
          (experience) => !isBlankExperience(experience),
        ),
      });
      setSaveSuccess(true);
      showToast({ message: "Mentor profiliniz kaydedildi.", tone: "success" });
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Profil kaydedilemedi.",
      );
      showToast({ message: "Mentor profili kaydedilemedi.", tone: "error" });
      return false;
    }
  };

  // A failed save keeps the form open, so the mentor can fix what was refused.
  const saveAndFinish = async () => {
    if (await handleSave()) setIsEditing(false);
  };

  const cancelEditing = () => {
    setForm(toEditablePayload(profile));
    setSpecialtyInput("");
    setSaveError("");
    setIsEditing(false);
  };

  return {
    form,
    specialtyInput,
    setSpecialtyInput,
    saveError,
    saveSuccess,
    isSaving: updateProfileMutation.isPending,
    isEditing,
    startEditing: () => setIsEditing(true),
    cancelEditing,
    saveAndFinish,
    updateField,
    updateCapacity,
    addExperience,
    updateExperience,
    removeExperience,
    canAddExperience: form.experiences.length < MAX_EXPERIENCES,
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

/** The "Müsaitliği düzenle" modal: weekly ranges, defaults and unavailable dates. */
export function useAvailabilitySettingsForm(onSaved: () => void) {
  const { showToast } = useToast();
  const settingsQuery = useMentorAvailabilitySettings();
  const updateSettings = useUpdateMentorAvailabilitySettings();
  const loaded = useMemo(
    () => (settingsQuery.data ? toAvailabilityDraft(settingsQuery.data) : null),
    [settingsQuery.data],
  );
  const [edits, setEdits] = useState<AvailabilityDraft | null>(null);
  const [exception, setException] = useState<ExceptionInput>(
    EMPTY_EXCEPTION_INPUT,
  );
  const [error, setError] = useState<string | null>(null);
  const nextKey = useRef(0);
  const draft = edits ?? loaded;

  const change = (
    update: (current: AvailabilityDraft) => AvailabilityDraft,
  ) => {
    setError(null);
    setEdits((current) => {
      const base = current ?? loaded;
      return base ? update(base) : current;
    });
  };
  // Keys are taken in the handler, not inside the state updater, so the updater stays pure.
  const newKey = () => `new-${(nextKey.current += 1)}`;

  const toggleDay = (day: Weekday) => {
    const key = newKey();
    change((current) =>
      current.ranges.some((range) => range.dayOfWeek === day)
        ? {
            ...current,
            ranges: current.ranges.filter((range) => range.dayOfWeek !== day),
          }
        : {
            ...current,
            ranges: [
              ...current.ranges,
              { key, dayOfWeek: day, ...DEFAULT_RANGE, slotMinutes: null },
            ],
          },
    );
  };

  const addRange = (day: Weekday) => {
    const key = newKey();
    change((current) => ({
      ...current,
      ranges: [
        ...current.ranges,
        {
          key,
          dayOfWeek: day,
          ...nextRangeAfter(rangesForDay(current, day)),
          slotMinutes: null,
        },
      ],
    }));
  };

  const removeRange = (key: string) =>
    change((current) => ({
      ...current,
      ranges: current.ranges.filter((range) => range.key !== key),
    }));

  const updateRange = (
    key: string,
    field: "startTime" | "endTime",
    value: string,
  ) =>
    change((current) => ({
      ...current,
      ranges: current.ranges.map((range) =>
        range.key === key ? { ...range, [field]: value } : range,
      ),
    }));

  const setNumber = (field: AvailabilityNumberField, value: string) =>
    change((current) => ({ ...current, [field]: value }));

  const setExceptionField = (field: keyof ExceptionInput, value: string) => {
    setError(null);
    setException((current) => ({ ...current, [field]: value }));
  };

  const addException = () => {
    if (!draft) return;
    const candidate = {
      startsOn: exception.startsOn,
      endsOn: exception.endsOn || exception.startsOn,
      reason: exception.reason.trim() || null,
    };
    const problem = exceptionError(candidate, draft.exceptions);
    if (problem) {
      setError(problem);
      return;
    }
    change((current) => ({
      ...current,
      exceptions: [...current.exceptions, candidate],
    }));
    setException(EMPTY_EXCEPTION_INPUT);
  };

  const removeException = (index: number) =>
    change((current) => ({
      ...current,
      exceptions: current.exceptions.filter(
        (_, position) => position !== index,
      ),
    }));

  const save = async () => {
    if (!draft) return;
    const problem = availabilityDraftError(draft, {
      capacityRequired: settingsQuery.data?.menteeCapacity != null,
    });
    if (problem) {
      setError(problem);
      return;
    }
    try {
      await updateSettings.mutateAsync(toAvailabilityPayload(draft));
      setEdits(null);
      showToast({
        message: "Müsaitlik ayarların kaydedildi.",
        tone: "success",
      });
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Müsaitlik ayarları kaydedilemedi.",
      );
      showToast({
        message: "Müsaitlik ayarları kaydedilemedi.",
        tone: "error",
      });
    }
  };

  return {
    addException,
    addRange,
    days: draft
      ? WEEKDAY_ORDER.map((day) => ({
          day,
          label: WEEKDAY_LABELS[day],
          ranges: rangesForDay(draft, day),
        }))
      : [],
    draft,
    error,
    exception,
    isSaving: updateSettings.isPending,
    loadError: settingsQuery.error ? "Müsaitlik ayarları yüklenemedi." : null,
    removeException,
    removeRange,
    save,
    setExceptionField,
    setNumber,
    toggleDay,
    updateRange,
  };
}
