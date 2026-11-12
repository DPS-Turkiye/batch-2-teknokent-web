"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAddProgramCoordinator } from "@/hooks/use-add-program-coordinator";
import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { ToastTone } from "@/interfaces/toast";
import {
  addedMessage,
  isAssignable,
  nameRequired,
} from "@/lib/admin-coordinators";
import {
  addCoordinator,
  getCoordinatorCandidate,
  resendCoordinatorPasswordSetup,
  setCoordinatorAccess,
} from "@/lib/client/admin-coordinators";
import { errorMessage, isEmailAddress } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

const CANDIDATE_QUERY_KEY = ["admin-coordinator-candidate"] as const;
const CHECK_DELAY_MS = 400;

/** The "Koordinatör ekle" form: checks the email as it is typed, then adds or promotes. */
export function useAddCoordinatorForm(onDone: () => void) {
  const t = useTranslations("adminCoordinators");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [checkedEmail, setCheckedEmail] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setCheckedEmail(email.trim()),
      CHECK_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [email]);

  const candidate = useQuery({
    queryKey: [...CANDIDATE_QUERY_KEY, checkedEmail],
    queryFn: () => getCoordinatorCandidate(checkedEmail),
    enabled: isEmailAddress(checkedEmail),
  });
  const current =
    candidate.data && checkedEmail === email.trim()
      ? candidate.data
      : undefined;
  const needsName = nameRequired(current);

  const save = useMutation({
    mutationFn: () =>
      addCoordinator({
        fullName: needsName ? fullName.trim() : (current?.fullName ?? ""),
        email: email.trim(),
      }),
    onSuccess: (account) => {
      void queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEY });
      showToast({ message: addedMessage(account, t), tone: ToastTone.Success });
      onDone();
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("addFailed")),
        tone: ToastTone.Error,
      }),
  });

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    candidate: current,
    checking: candidate.isFetching || (isEmailAddress(email) && !current),
    checkError: candidate.error,
    needsName,
    canSave:
      isAssignable(current) &&
      (!needsName || fullName.trim().length > 0) &&
      !save.isPending,
    saving: save.isPending,
    save: () => save.mutate(),
  };
}

/** "Pasife al" / "Yeniden etkinleştir" in a coordinator's drawer. */
export function useCoordinatorAccess() {
  const t = useTranslations("adminCoordinators");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setCoordinatorAccess(id, active),
    onSuccess: (account, { active }) => {
      void queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      showToast({
        message: active
          ? t("reactivated", { name: account.fullName })
          : t("deactivated", { name: account.fullName }),
        tone: ToastTone.Success,
      });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("accessFailed")),
        tone: ToastTone.Error,
      }),
  });
  return {
    setAccess: (id: string, active: boolean) => mutation.mutate({ id, active }),
    busy: mutation.isPending,
  };
}

/** "Şifre e-postasını tekrar gönder": a fresh password setup link for a coordinator who lost the first one. */
export function useCoordinatorPasswordSetup() {
  const t = useTranslations("adminCoordinators");
  const { showToast } = useToast();
  const mutation = useMutation({
    mutationFn: (id: string) => resendCoordinatorPasswordSetup(id),
    onSuccess: (account) =>
      showToast({
        message: t("setupSent", { email: account.email }),
        tone: ToastTone.Success,
      }),
    onError: (error) =>
      showToast({
        message: errorMessage(error, t("setupFailed")),
        tone: ToastTone.Error,
      }),
  });
  return {
    resend: (id: string) => mutation.mutate(id),
    busy: mutation.isPending,
  };
}

/** The admin's "Koordinatör ata" popup: search or invite by email; the picked person joins the program at once. */
export function useAssignProgramCoordinator(
  programId: string,
  onDone: () => void,
) {
  const queryClient = useQueryClient();
  const add = useAddProgramCoordinator(programId, () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_OVERVIEW_QUERY_KEY });
    onDone();
  });
  return {
    ...add,
    /** Escape, the overlay or Vazgeç; ignored while a pick is being saved so its outcome is seen. */
    close: () => {
      if (!add.adding) onDone();
    },
  };
}
