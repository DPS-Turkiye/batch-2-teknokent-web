"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useWeeklyAvailabilityForm } from "@/hooks/use-weekly-availability-form";
import { clientText } from "@/i18n/client-texts";
import {
  MAX_EDUCATIONS,
  MentorLanguage,
  type MeetingFrequency,
  type MentorEducationInput,
  type MentorExperienceInput,
  type MentorProfile,
  type PrepFileRequirement,
  type UpdateMentorAvailabilitySettingsPayload,
  type UpdateMentorProfilePayload,
} from "@/interfaces/mentor";
import type { StudentOnboardingDraft } from "@/interfaces/mentor-onboarding";
import { ToastTone } from "@/interfaces/toast";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getAvailabilitySettings,
  getMentorAvailability,
  getMentorProfile,
  updateAvailabilitySettings,
  updateMentorProfile,
} from "@/lib/client/mentor-profile";
import { withKey, withKeys, withoutKeys, type Keyed } from "@/lib/keyed-list";
import {
  applyMentorCv,
  fillStudies,
  type MentorCvResult,
} from "@/lib/mentor-cv";
import {
  toStudentDraft,
  toStudentProfilePayload,
} from "@/lib/mentor-onboarding";
import { errorMessage, toDateTimeLocalValue } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

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

// A student mentor's studies are edited beside the form, so mentors who are not students never send them.
// Past roles and schools carry React keys while they are edited (see keyed-list); handleSave takes them off.
type MentorProfileForm = Omit<
  Required<Omit<UpdateMentorProfilePayload, "studentProfile">>,
  "experiences" | "educations"
> & {
  experiences: Keyed<MentorExperienceInput>[];
  educations: Keyed<MentorEducationInput>[];
};

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
    experiences: withKeys(
      (profile.experiences ?? []).map((experience) => ({
        title: experience.title,
        organization: experience.organization ?? "",
        period: experience.period ?? "",
        summary: experience.summary ?? "",
      })),
    ),
    educations: withKeys(
      (profile.educations ?? []).map((education) => ({
        school: education.school,
        degree: education.degree ?? "",
        period: education.period ?? "",
      })),
    ),
    about: profile.about ?? "",
    meetingFrequency: profile.meetingFrequency ?? null,
    prepFileRequirement: profile.prepFileRequirement ?? null,
    languages: profile.languages ?? [],
    offerings: profile.offerings ?? [],
    programRoles: (profile.programs ?? []).map((program) => ({
      programId: program.id,
      role: program.role ?? "",
    })),
  };
}

const MAX_EXPERIENCES = 10;
const MAX_PROGRAM_ROLE_LENGTH = 80;
const LANGUAGE_ORDER = Object.values(MentorLanguage);
const EMPTY_EXPERIENCE: MentorExperienceInput = {
  title: "",
  organization: "",
  period: "",
  summary: "",
};

function isBlankSchool(school: MentorEducationInput) {
  return [school.school, school.degree, school.period].every(
    (value) => !value.trim(),
  );
}

function isBlankExperience(experience: MentorExperienceInput) {
  return [
    experience.title,
    experience.organization,
    experience.period,
    experience.summary,
  ].every((value) => !value.trim());
}

function studentDraftOf(profile: MentorProfile) {
  return profile.studentProfile ? toStudentDraft(profile.studentProfile) : null;
}

/** The first problem that would make the backend refuse the save, or "". */
export function mentorProfileFormError(
  form: MentorProfileForm,
  student: StudentOnboardingDraft | null = null,
) {
  if (
    form.educations.some(
      (school) => !isBlankSchool(school) && !school.school.trim(),
    )
  ) {
    return clientText("mentorProfile.schoolName");
  }
  if (student && !(student.department.trim() && student.studyYear)) {
    return clientText("mentorProfile.studentRequired");
  }
  const capacity = form.menteeCapacity;
  if (
    capacity !== null &&
    (!Number.isInteger(capacity) || capacity < 1 || capacity > 50)
  ) {
    return clientText("mentorProfile.capacity");
  }
  if (
    form.experiences.some(
      (experience) =>
        !isBlankExperience(experience) && !experience.title.trim(),
    )
  ) {
    return clientText("mentorProfile.roleTitle");
  }
  if (
    form.programRoles.some(
      (programRole) => programRole.role.trim().length > MAX_PROGRAM_ROLE_LENGTH,
    )
  ) {
    return clientText("mentorProfile.programRole", {
      max: MAX_PROGRAM_ROLE_LENGTH,
    });
  }
  return "";
}

export function useMentorProfileForm(profile: MentorProfile) {
  const t = useTranslations("mentorProfile");
  const { showToast } = useToast();
  const updateProfileMutation = useUpdateMentorProfile();
  const [form, setForm] = useState<MentorProfileForm>(() =>
    toEditablePayload(profile),
  );
  const [student, setStudent] = useState(() => studentDraftOf(profile));
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const updateField = (
    key: Exclude<
      keyof UpdateMentorProfilePayload,
      | "specialties"
      | "menteeCapacity"
      | "experiences"
      | "meetingFrequency"
      | "prepFileRequirement"
      | "languages"
      | "programRoles"
      | "studentProfile"
      | "educations"
    >,
    value: string,
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateStudent = (key: keyof StudentOnboardingDraft, value: string) => {
    setStudent((previous) => (previous ? { ...previous, [key]: value } : null));
  };

  const updateCapacity = (value: string) => {
    setForm((previous) => ({
      ...previous,
      menteeCapacity: value.trim() ? Number(value) : null,
    }));
  };

  const setMeetingFrequency = (value: MeetingFrequency | null) => {
    setForm((previous) => ({ ...previous, meetingFrequency: value }));
  };

  const setPrepFileRequirement = (value: PrepFileRequirement | null) => {
    setForm((previous) => ({ ...previous, prepFileRequirement: value }));
  };

  const toggleLanguage = (language: MentorLanguage) => {
    setForm((previous) => {
      const chosen = previous.languages.includes(language)
        ? previous.languages.filter((item) => item !== language)
        : [...previous.languages, language];
      return {
        ...previous,
        languages: LANGUAGE_ORDER.filter((item) => chosen.includes(item)),
      };
    });
  };

  const updateProgramRole = (programId: string, role: string) => {
    setForm((previous) => ({
      ...previous,
      programRoles: previous.programRoles.map((programRole) =>
        programRole.programId === programId
          ? { ...programRole, role }
          : programRole,
      ),
    }));
  };

  const addExperience = () => {
    setForm((previous) =>
      previous.experiences.length >= MAX_EXPERIENCES
        ? previous
        : {
            ...previous,
            experiences: [...previous.experiences, withKey(EMPTY_EXPERIENCE)],
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

  const addEducation = () => {
    setForm((previous) =>
      previous.educations.length >= MAX_EDUCATIONS
        ? previous
        : {
            ...previous,
            educations: [
              ...previous.educations,
              withKey({ school: "", degree: "", period: "" }),
            ],
          },
    );
  };

  const updateEducation = (
    index: number,
    field: keyof MentorEducationInput,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      educations: previous.educations.map((school, position) =>
        position === index ? { ...school, [field]: value } : school,
      ),
    }));
  };

  const removeEducation = (index: number) => {
    setForm((previous) => ({
      ...previous,
      educations: previous.educations.filter(
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

  const applyCv = (cv: MentorCvResult) => {
    setForm((previous) => applyMentorCv(previous, cv, MAX_EXPERIENCES));
    setStudent((previous) =>
      previous ? fillStudies(previous, cv.studies, true) : previous,
    );
  };

  /** True once the backend has the profile, so callers can leave edit mode. */
  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess(false);
    const problem = mentorProfileFormError(form, student);
    if (problem) {
      setSaveError(problem);
      return false;
    }
    try {
      await updateProfileMutation.mutateAsync({
        ...form,
        experiences: withoutKeys(
          form.experiences.filter(
            (experience) => !isBlankExperience(experience),
          ),
        ),
        educations: withoutKeys(
          form.educations.filter((school) => !isBlankSchool(school)),
        ),
        ...(student
          ? { studentProfile: toStudentProfilePayload(student) }
          : {}),
      });
      setSaveSuccess(true);
      showToast({ message: t("saved"), tone: ToastTone.Success });
      return true;
    } catch (error) {
      const message = errorMessage(error, t("saveFailed"));
      setSaveError(message);
      showToast({ message, tone: ToastTone.Error });
      return false;
    }
  };

  // A failed save keeps the form open, so the mentor can fix what was refused.
  const saveAndFinish = async () => {
    if (await handleSave()) setIsEditing(false);
  };

  // Editing starts from the latest profile, so a capacity saved in the
  // availability editor since this form mounted is not sent back stale.
  const startEditing = () => {
    setForm(toEditablePayload(profile));
    setStudent(studentDraftOf(profile));
    setSaveError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(toEditablePayload(profile));
    setStudent(studentDraftOf(profile));
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
    startEditing,
    cancelEditing,
    saveAndFinish,
    updateField,
    student,
    updateStudent,
    updateCapacity,
    setMeetingFrequency,
    setPrepFileRequirement,
    toggleLanguage,
    programRole: (programId: string) =>
      form.programRoles.find((item) => item.programId === programId)?.role ??
      "",
    updateProgramRole,
    addExperience,
    updateExperience,
    removeExperience,
    canAddExperience: form.experiences.length < MAX_EXPERIENCES,
    addEducation,
    updateEducation,
    removeEducation,
    canAddEducation: form.educations.length < MAX_EDUCATIONS,
    addSpecialty,
    removeSpecialty,
    applyCv,
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
      showToast({
        message: "Müsaitlik saati eklendi.",
        tone: ToastTone.Success,
      });
    } catch (error) {
      const message = errorMessage(error, "Müsaitlik saati eklenemedi.");
      setSlotError(message);
      showToast({ message, tone: ToastTone.Error });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlotMutation.mutateAsync(slotId);
      showToast({
        message: "Müsaitlik saati silindi.",
        tone: ToastTone.Success,
      });
    } catch (error) {
      showToast({
        message: errorMessage(error, "Müsaitlik saati silinemedi."),
        tone: ToastTone.Error,
      });
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

/** The "Müsaitliği düzenle" modal: the weekly availability editor on the mentor's own settings. */
export function useAvailabilitySettingsForm(onSaved: () => void) {
  const settingsQuery = useMentorAvailabilitySettings();
  const updateSettings = useUpdateMentorAvailabilitySettings();
  return useWeeklyAvailabilityForm(
    {
      settings: settingsQuery.data,
      loadFailed: Boolean(settingsQuery.error),
      save: updateSettings.mutateAsync,
      isSaving: updateSettings.isPending,
    },
    onSaved,
  );
}
