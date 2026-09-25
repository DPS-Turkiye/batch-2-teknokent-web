"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import {
  addCoordinator,
  getCoordinatorCandidate,
  setCoordinatorAccess,
} from "@/lib/client/admin-coordinators";
import {
  addedMessage,
  isAssignable,
  nameRequired,
} from "@/lib/admin-coordinators";
import { errorMessage, isEmailAddress } from "@/lib/utils";

const CANDIDATE_QUERY_KEY = ["admin-coordinator-candidate"] as const;
const CHECK_DELAY_MS = 400;

/** The "Koordinatör ekle" form: checks the email as it is typed, then adds or promotes. */
export function useAddCoordinatorForm(onDone: () => void) {
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
      showToast({ message: addedMessage(account), tone: "success" });
      onDone();
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Koordinatör eklenemedi."),
        tone: "error",
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
          ? `${account.fullName} yeniden etkinleştirildi.`
          : `${account.fullName} pasife alındı; artık giriş yapamaz.`,
        tone: "success",
      });
    },
    onError: (error) =>
      showToast({
        message: errorMessage(error, "Erişim değiştirilemedi."),
        tone: "error",
      }),
  });
  return {
    setAccess: (id: string, active: boolean) => mutation.mutate({ id, active }),
    busy: mutation.isPending,
  };
}
