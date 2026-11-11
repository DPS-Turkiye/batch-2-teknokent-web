"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCoordinatorAccess } from "@/hooks/use-admin-coordinators";
import { useDecidePendingAccount } from "@/hooks/use-pending-accounts";
import type { AdminOverview, AdminUser } from "@/interfaces/admin-overview";
import { UserAccountStatus } from "@/interfaces/session";
import { ToastTone } from "@/interfaces/toast";
import {
  assignableProgramsForMentor,
  coordinatorsOf,
  mentorsOf,
  startupsOf,
} from "@/lib/admin-model";
import {
  coordinatorCounts,
  filterCoordinators,
  filterMentors,
  filterTeams,
  mentorCounts,
  mentorRow,
  pageOf,
  teamCounts,
  teamKey,
  teamRow,
} from "@/lib/admin-users";
import { errorMessage } from "@/lib/utils";
import { useToast } from "@/stores/toast-store";
import { UserFilter } from "@/types/admin-users";

type AccountDecision = UserAccountStatus.Approved | UserAccountStatus.Rejected;

/** The chip, program, search text and page of a users table; narrowing it starts again from the first page. */
export function useUserListFilters() {
  const [filter, setFilter] = useState<UserFilter>(UserFilter.All);
  const [program, setProgram] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  return {
    filter,
    program,
    search,
    page,
    setPage,
    onFilter: (value: UserFilter) => {
      setFilter(value);
      setPage(0);
    },
    onProgram: (value: string) => {
      setProgram(value);
      setPage(0);
    },
    onSearch: (value: string) => {
      setSearch(value);
      setPage(0);
    },
  };
}

/**
 * Calls onFocus once for each `?user=` focus: on the first render when the page is opened with one (a link from
 * elsewhere in the admin area), and again whenever it changes.
 */
function useFocusChange(
  focusUserId: string | null,
  onFocus: (id: string | null) => void,
) {
  const [seenFocus, setSeenFocus] = useState<string | null>(null);
  if (focusUserId !== seenFocus) {
    setSeenFocus(focusUserId);
    onFocus(focusUserId);
  }
}

/** The Koordinatörler table: its rows, the open drawer or dialog, and approving or rejecting an application. */
export function useCoordinatorsTable(
  data: AdminOverview,
  focusUserId: string | null,
) {
  const t = useTranslations("adminUsers");
  const users = coordinatorsOf(data);
  const decide = useDecidePendingAccount();
  const access = useCoordinatorAccess();
  const { showToast } = useToast();
  const filters = useUserListFilters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  useFocusChange(focusUserId, (id) => {
    const focused = users.find((item) => item.id === id);
    if (focused?.status === UserAccountStatus.Pending) setReviewId(focused.id);
    else if (focused) setSelectedId(focused.id);
  });
  const rows = filterCoordinators(data, users, filters);

  function reject(user: AdminUser) {
    void decide
      .mutateAsync({ userId: user.id, status: UserAccountStatus.Rejected })
      .then(() => {
        setReviewId(null);
        setApproveId(null);
        showToast({
          message: t("rejected", { name: user.fullName }),
          tone: ToastTone.Success,
        });
      })
      .catch((error: unknown) =>
        showToast({
          message: errorMessage(error, t("decideFailed")),
          tone: ToastTone.Error,
        }),
      );
  }

  /** A pending application opens for review; anyone else opens in the drawer. */
  function openDetail(user: AdminUser) {
    if (user.status === UserAccountStatus.Pending) setReviewId(user.id);
    else setSelectedId(user.id);
  }

  function approved(user: AdminUser, programName: string, already?: boolean) {
    setApproveId(null);
    showToast({
      title: t("approvedTitle", { name: user.fullName }),
      message: already
        ? t("alreadyCoordinator", { program: programName })
        : t("assignedTo", { program: programName }),
      tone: ToastTone.Success,
      action: { label: t("detail"), onClick: () => setSelectedId(user.id) },
    });
  }

  function approveFailed(message: string) {
    setApproveId(null);
    showToast({ message, tone: ToastTone.Error });
  }

  return {
    filters,
    counts: coordinatorCounts(users),
    total: rows.length,
    visible: pageOf(rows, filters.page),
    selectedId,
    selected: users.find((user) => user.id === selectedId) ?? null,
    review: users.find((user) => user.id === reviewId) ?? null,
    approving: users.find((user) => user.id === approveId) ?? null,
    isDeciding: decide.isPending,
    select: setSelectedId,
    closeDrawer: () => setSelectedId(null),
    startReview: setReviewId,
    closeReview: () => setReviewId(null),
    startApproval: (user: AdminUser) => {
      setReviewId(null);
      setApproveId(user.id);
    },
    closeApproval: () => setApproveId(null),
    openDetail,
    reject,
    approved,
    approveFailed,
    setAccess: access.setAccess,
  };
}

/** The Mentorlar table: its rows, the open drawer, and deciding a pending mentor account. */
export function useMentorsTable(
  data: AdminOverview,
  focusUserId: string | null,
) {
  const t = useTranslations("adminUsers");
  const users = mentorsOf(data);
  const decide = useDecidePendingAccount();
  const { showToast } = useToast();
  const filters = useUserListFilters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useFocusChange(focusUserId, (id) => {
    if (users.some((user) => user.id === id)) setSelectedId(id);
  });
  const rows = filterMentors(data, users, filters);

  function decideAccount(user: AdminUser, status: AccountDecision) {
    void decide
      .mutateAsync({ userId: user.id, status })
      .then(() =>
        showToast({
          message:
            status === UserAccountStatus.Approved
              ? t("approved", { name: user.fullName })
              : t("rejected", { name: user.fullName }),
          tone: ToastTone.Success,
        }),
      )
      .catch((error: unknown) =>
        showToast({
          message: errorMessage(error, t("decideFailed")),
          tone: ToastTone.Error,
        }),
      );
  }

  const selected = users.find((user) => user.id === selectedId) ?? null;
  return {
    filters,
    counts: mentorCounts(data, users),
    total: rows.length,
    visible: pageOf(rows, filters.page).map((user) => mentorRow(data, user)),
    selected: selected
      ? {
          ...mentorRow(data, selected),
          assignable: assignableProgramsForMentor(data, selected.id),
        }
      : null,
    isDeciding: decide.isPending,
    select: setSelectedId,
    closeDrawer: () => setSelectedId(null),
    decideAccount,
  };
}

/** The Takımlar table: its rows and the open drawer. */
export function useTeamsTable(data: AdminOverview) {
  const teams = startupsOf(data);
  const filters = useUserListFilters();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const rows = filterTeams(data, teams, filters);
  return {
    filters,
    counts: teamCounts(data, teams),
    total: rows.length,
    visible: pageOf(rows, filters.page).map((startup) =>
      teamRow(data, startup),
    ),
    selected: teams.find((startup) => teamKey(startup) === selectedKey) ?? null,
    select: setSelectedKey,
    closeDrawer: () => setSelectedKey(null),
  };
}
