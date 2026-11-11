"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CoordinatorCandidateStatus } from "@/interfaces/admin-coordinator";
import {
  getCoordinatorCandidate,
  searchCoordinators,
} from "@/lib/client/admin-coordinators";
import {
  addChoice,
  choiceKey,
  CoordinatorChoiceKind,
  existingChoice,
  inviteCandidateEmail,
  invitedChoice,
  isSearchable,
  removeChoice,
  unpickedResults,
  type CoordinatorChoice,
} from "@/lib/coordinator-picker";
import { errorMessage } from "@/lib/utils";

export const COORDINATOR_SEARCH_QUERY_KEY = [
  "admin-coordinator-search",
] as const;
export const COORDINATOR_INVITE_CHECK_QUERY_KEY = [
  "admin-coordinator-invite-check",
] as const;
const SEARCH_DELAY_MS = 300;

/**
 * The admin's coordinator email field: nobody is listed until at least three characters are typed, then approved
 * coordinators whose email starts with them. A whole email with no account can be invited by name; an account in
 * any other role is explained, never promoted from here.
 */
export function useCoordinatorPicker({
  chosen,
  onChange,
  programId,
}: {
  chosen: readonly CoordinatorChoice[];
  onChange: (next: CoordinatorChoice[]) => void;
  programId?: string | undefined;
}) {
  const t = useTranslations("coordinatorPicker");
  const roles = useTranslations("adminCoordinators.roles");
  const [query, setQuery] = useState("");
  const [settledQuery, setSettledQuery] = useState("");
  const [inviteName, setInviteName] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setSettledQuery(query.trim()),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [query]);

  const settled = settledQuery === query.trim();
  const search = useQuery({
    queryKey: [
      ...COORDINATOR_SEARCH_QUERY_KEY,
      settledQuery,
      programId ?? null,
    ],
    queryFn: () => searchCoordinators(settledQuery, programId),
    enabled: isSearchable(settledQuery),
  });
  const found = settled && isSearchable(settledQuery) ? search.data : undefined;
  const inviteEmail = found
    ? inviteCandidateEmail(settledQuery, found, chosen)
    : null;
  const check = useQuery({
    queryKey: [...COORDINATOR_INVITE_CHECK_QUERY_KEY, inviteEmail],
    queryFn: () => getCoordinatorCandidate(inviteEmail ?? ""),
    enabled: inviteEmail !== null,
    // A cached "no account" would offer to invite someone a just-saved program has already given an account.
    staleTime: 0,
  });
  const candidate = inviteEmail === null ? undefined : check.data;
  const invitable = candidate?.status === CoordinatorCandidateStatus.New;
  const results = found ? unpickedResults(found, chosen) : [];

  const clear = () => {
    setQuery("");
    setSettledQuery("");
    setInviteName("");
  };

  const refusal =
    candidate && candidate.status !== CoordinatorCandidateStatus.New
      ? t(`refusal.${candidate.status}`, {
          name: candidate.fullName ?? candidate.email,
          role: candidate.role ? roles(candidate.role) : t("someone"),
        })
      : null;
  const failure = search.error ?? (inviteEmail ? check.error : null);

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setInviteName("");
    },
    tooShort: query.trim().length > 0 && !isSearchable(query),
    searching:
      (isSearchable(query) && !settled) ||
      search.isFetching ||
      check.isFetching,
    error: failure ? errorMessage(failure, t("searchFailed")) : null,
    results,
    noMatches: found?.length === 0 && inviteEmail === null && !failure,
    inviteEmail: invitable ? inviteEmail : null,
    inviteName,
    setInviteName,
    canInvite: invitable && inviteName.trim().length > 0,
    refusal,
    pick: (id: string) => {
      const result = results.find((item) => item.id === id);
      if (!result) return;
      onChange(addChoice(chosen, existingChoice(result)));
      clear();
    },
    invite: () => {
      if (!invitable || !inviteEmail || !inviteName.trim()) return;
      onChange(addChoice(chosen, invitedChoice(inviteEmail, inviteName)));
      clear();
    },
    chosen: chosen.map((choice) => ({
      key: choiceKey(choice),
      fullName: choice.fullName,
      email: choice.email,
      invited: choice.kind === CoordinatorChoiceKind.Invited,
    })),
    remove: (key: string) => onChange(removeChoice(chosen, key)),
  };
}
