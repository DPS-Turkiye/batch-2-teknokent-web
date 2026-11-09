"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useToast } from "@/stores/toast-store";
import { STARTUP_PROFILE_QUERY_KEY } from "@/hooks/use-startup-profile";
import type { StartupProfile } from "@/interfaces/organization";
import { saveStartupStatus } from "@/lib/client/organization";
import { ToastTone } from "@/interfaces/toast";

export type StartupStatusDraft = {
  statusVersion: string;
  statusSummary: string;
  completionPercent: string;
};

const EMPTY_DRAFT: StartupStatusDraft = {
  statusVersion: "",
  statusSummary: "",
  completionPercent: "",
};

function isValidPercent(value: string) {
  if (value.trim() === "") return true;
  const percent = Number(value);
  return Number.isInteger(percent) && percent >= 0 && percent <= 100;
}

function draftFrom(profile: StartupProfile | null): StartupStatusDraft {
  if (!profile) return EMPTY_DRAFT;
  return {
    statusVersion: profile.statusVersion ?? "",
    statusSummary: profile.statusSummary ?? "",
    completionPercent:
      profile.completionPercent == null
        ? ""
        : String(profile.completionPercent),
  };
}

/** The "Durumu güncelle" dialog: its open state, draft and save. */
export function useStartupStatusForm(profile: StartupProfile | null) {
  const t = useTranslations("startupProfile.statusDialog");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<StartupStatusDraft>(EMPTY_DRAFT);

  const mutation = useMutation({
    mutationFn: saveStartupStatus,
    onSuccess: (saved) => {
      queryClient.setQueryData(STARTUP_PROFILE_QUERY_KEY, saved);
      setIsOpen(false);
      showToast({ message: t("saved"), tone: ToastTone.Success });
    },
    onError: () =>
      showToast({ message: t("saveFailed"), tone: ToastTone.Error }),
  });

  const error = isValidPercent(draft.completionPercent)
    ? null
    : t("percentInvalid");

  function open() {
    setDraft(draftFrom(profile));
    mutation.reset();
    setIsOpen(true);
  }

  function setField(field: keyof StartupStatusDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    if (error) return;
    mutation.mutate({
      statusVersion: draft.statusVersion.trim() || null,
      statusSummary: draft.statusSummary.trim() || null,
      completionPercent:
        draft.completionPercent.trim() === ""
          ? null
          : Number(draft.completionPercent),
    });
  }

  return {
    close: () => setIsOpen(false),
    draft,
    error,
    isOpen,
    isSaving: mutation.isPending,
    open,
    setField,
    submit,
  };
}
