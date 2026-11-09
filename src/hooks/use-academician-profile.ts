"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { useToast } from "@/stores/toast-store";
import { useStudentInstitution } from "@/hooks/use-student-profile";
import type { OfficeHoursProfileSettings } from "@/interfaces/academician-office-hours";
import {
  getOfficeHoursProfileSettings,
  saveOfficeHoursProfileSettings,
} from "@/lib/client/academician-office-hours";
import { ACADEMICIAN_OFFICE_HOURS_QUERY_KEY } from "@/lib/academician-office-hours";
import { httpUrlOrNull, isEmailAddress } from "@/lib/utils";
import { ToastTone } from "@/interfaces/toast";

export const OFFICE_HOURS_PROFILE_QUERY_KEY = [
  ...ACADEMICIAN_OFFICE_HOURS_QUERY_KEY,
  "profile",
] as const;

type ProfileField = keyof OfficeHoursProfileSettings;
type ProfileForm = Record<ProfileField, string>;

function toForm(settings: OfficeHoursProfileSettings): ProfileForm {
  return {
    defaultPlace: settings.defaultPlace ?? "",
    onlineLink: settings.onlineLink ?? "",
    contactEmail: settings.contactEmail ?? "",
  };
}

function optional(value: string) {
  return value.trim() || null;
}

/** Profilim: ODTÜ's record (read-only) next to the Office Hours details students see. */
export function useAcademicianProfile() {
  const t = useTranslations("academicianWorkspace.profile");
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  // A 404 means no institution vouches for the account: shown as "no record", not an error.
  const record = useStudentInstitution();
  const settings = useQuery({
    queryKey: OFFICE_HOURS_PROFILE_QUERY_KEY,
    queryFn: getOfficeHoursProfileSettings,
  });
  const [edits, setEdits] = useState<ProfileForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>(
    {},
  );
  const form = edits ?? (settings.data ? toForm(settings.data) : null);

  const save = useMutation({
    mutationFn: (next: OfficeHoursProfileSettings) =>
      saveOfficeHoursProfileSettings(next),
    onSuccess: (saved) => {
      queryClient.setQueryData(OFFICE_HOURS_PROFILE_QUERY_KEY, saved);
      setEdits(null);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: () =>
      showToast({ message: t("saveFailed"), tone: ToastTone.Error }),
  });

  const change = (field: ProfileField, value: string) => {
    if (!form) return;
    setErrors((current) => ({ ...current, [field]: undefined }));
    setEdits({ ...form, [field]: value });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const next: Partial<Record<ProfileField, string>> = {};
    if (form.onlineLink.trim() && !httpUrlOrNull(form.onlineLink)) {
      next.onlineLink = t("invalidLink");
    }
    if (form.contactEmail.trim() && !isEmailAddress(form.contactEmail)) {
      next.contactEmail = t("invalidEmail");
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    save.mutate({
      defaultPlace: optional(form.defaultPlace),
      onlineLink: httpUrlOrNull(form.onlineLink),
      contactEmail: optional(form.contactEmail),
    });
  };

  return {
    record: record.record,
    recordLoading: record.isLoading,
    recordError: record.error,
    retryRecord: record.retry,
    form,
    errors,
    change,
    submit,
    isSaving: save.isPending,
    isDirty: edits !== null,
    settingsLoading: settings.isLoading,
    settingsError: settings.error,
    retrySettings: () => void settings.refetch(),
  };
}
