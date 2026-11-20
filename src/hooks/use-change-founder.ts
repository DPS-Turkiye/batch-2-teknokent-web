"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ADMIN_OVERVIEW_QUERY_KEY } from "@/hooks/use-admin-overview";
import { useEdition } from "@/hooks/use-edition";
import { personSummaryQueryKey } from "@/hooks/use-person-summary";
import { programTeamsQueryKey } from "@/hooks/use-program-teams";
import type { FounderChangePerson } from "@/interfaces/founder-change";
import { ToastTone } from "@/interfaces/toast";
import {
  changeFounder,
  getFounderChangeOptions,
} from "@/lib/client/founder-change";
import { getPersonSummary } from "@/lib/client/person-summary";
import { offersFounderChange } from "@/lib/edition-screens";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";

export const founderChangeQueryKey = (organizationId: string) =>
  ["founder-change", organizationId] as const;

/** Every person's profile summary: both founders' "Kurucu" badge changes. */
const PERSON_SUMMARIES_KEY = ["person-summary"] as const;

export type FounderChange = ReturnType<typeof useChangeFounder>;

/** Whether this edition lets admins and coordinators change founders; the backend closes it elsewhere. */
export function useFounderChangeAvailable() {
  return offersFounderChange(useEdition());
}

/**
 * "Kurucuyu değiştir" for one startup, from an admin or coordinator screen. The members who may take over load
 * only once the dialog opens. `programId` is the coordinator program whose team lists must refresh.
 */
export function useChangeFounder(organizationId: string, programId?: string) {
  const t = useTranslations("founderChange");
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [candidateId, setCandidateId] = useState("");

  const options = useQuery({
    queryKey: founderChangeQueryKey(organizationId),
    queryFn: () => getFounderChangeOptions(organizationId),
    enabled: open,
  });
  const data = options.data;
  const candidate: FounderChangePerson | null =
    data?.candidates.find((person) => person.id === candidateId) ?? null;

  function reset() {
    setOpen(false);
    setCandidateId("");
    // The button stays mounted, so the query is removed by hand: a reopened dialog never shows (or acts on) a
    // team that changed since.
    queryClient.removeQueries({
      queryKey: founderChangeQueryKey(organizationId),
    });
  }

  const change = useMutation({
    mutationFn: (newFounderId: string) =>
      changeFounder(organizationId, newFounderId),
    // On the mutation, not the call: the change happened even if the dialog was closed before the answer came.
    onSuccess: () => {
      showToast({
        message: t("changed", {
          name: candidate?.fullName ?? "",
          team: data?.name ?? "",
        }),
        tone: ToastTone.Success,
      });
      reset();
      const keys = [
        PERSON_SUMMARIES_KEY,
        ADMIN_OVERVIEW_QUERY_KEY,
        ...(programId ? [programTeamsQueryKey(programId)] : []),
      ];
      keys.forEach(
        (queryKey) => void queryClient.invalidateQueries({ queryKey }),
      );
    },
    onError: (error) => {
      showToast({
        message: errorMessage(error, t("failed")),
        tone: ToastTone.Error,
      });
    },
  });

  return {
    open,
    show: () => setOpen(true),
    close: () => {
      // Escape or a backdrop click must not hide a change that is already on its way.
      if (!change.isPending) reset();
    },
    loading: options.isLoading,
    loadError: options.error
      ? errorMessage(options.error, t("loadFailed"))
      : null,
    teamName: data?.name ?? "",
    founderName: data?.currentFounder?.fullName ?? null,
    loaded: data !== undefined,
    candidates: data?.candidates ?? [],
    candidateId,
    select: setCandidateId,
    candidate,
    canChange: candidate !== null && !change.isPending,
    confirm: () => {
      if (candidate && !change.isPending) change.mutate(candidate.id);
    },
    pending: change.isPending,
  };
}

/** The startup whose founder the admin profile's "Kurucuyu değiştir" section changes; null for anyone without one. */
export function useFounderChangeStartup(userId: string) {
  // Shares the profile page's query, so the account is read once.
  const { data: person } = useQuery({
    queryKey: personSummaryQueryKey(userId),
    queryFn: () => getPersonSummary(userId),
  });
  return person?.startup ?? null;
}
