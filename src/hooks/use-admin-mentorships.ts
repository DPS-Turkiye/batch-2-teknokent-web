"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useAdminInterventions } from "@/hooks/use-admin-interventions";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { ToastTone } from "@/interfaces/toast";
import {
  ALL_PROGRAMS,
  interventionCounts,
  interventionEntries,
  interventionFilterOf,
  interventionRows,
  livePrograms,
  matchingSummary,
  openFollowUps,
  pairLabel,
  programsInScope,
  visibleInterventions,
  visibleMatches,
  waitingTeams,
  type MentorshipsT,
} from "@/lib/admin-mentorships";
import { isEnumValue } from "@/lib/enum";
import { ALL_PROGRAM_TYPES, type ProgramTypeFilter } from "@/lib/program-types";
import { useToast } from "@/stores/toast-store";
import {
  InterventionFilter,
  MatchingFilter,
  MatchingSort,
} from "@/types/admin-mentorships";

/** Admin › Mentorluklar: the overview query, the type and scope selects, and the programs they leave. */
export function useAdminMentorships() {
  const t = useTranslations("adminMentorships");
  const query = useAdminOverview();
  const [scope, setScope] = useState(ALL_PROGRAMS);
  const [type, setType] = useState<ProgramTypeFilter>(ALL_PROGRAM_TYPES);
  const selectType = (value: ProgramTypeFilter) => {
    setType(value);
    setScope(ALL_PROGRAMS);
  };
  const data = query.data;
  const screen = data ? scopedPrograms(data, type, scope, t) : null;
  return { query, data, screen, type, selectType, scope, setScope };
}

function scopedPrograms(
  data: AdminOverview,
  type: ProgramTypeFilter,
  scope: string,
  t: MentorshipsT,
) {
  const { typed, programs } = programsInScope(data.programs, type, scope);
  const live = livePrograms(programs);
  return {
    typedNames: typed.map((program) => program.name),
    programs,
    live,
    interventionCount: interventionRows(data, live, t).length,
    waitingCount: waitingTeams(data, live).length,
  };
}

/** The interventions tab: its rows and filters, the coordinator follow-ups, and the notify dialog and drawer. */
export function useMentorshipInterventions(
  data: AdminOverview,
  programs: AdminProgram[],
) {
  const t = useTranslations("adminMentorships");
  const params = useSearchParams();
  const follow = useAdminInterventions();
  const { showToast } = useToast();
  const [filter, setFilter] = useState(() =>
    interventionFilterOf(params.get("filter")),
  );
  const [program, setProgram] = useState(params.get("program") ?? ALL_PROGRAMS);
  const [search, setSearch] = useState("");
  const [notifyId, setNotifyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const entries = interventionEntries(
    interventionRows(data, programs, t),
    openFollowUps(follow.data ?? []),
  );
  const notifyRow =
    entries.find((entry) => entry.row.mentorshipId === notifyId)?.row ?? null;
  const detail = entries.find((entry) => entry.tracked?.id === detailId);

  return {
    filter,
    selectFilter: (value: string) => {
      if (isEnumValue(InterventionFilter, value)) setFilter(value);
    },
    program,
    setProgram,
    search,
    setSearch,
    counts: interventionCounts(entries),
    visible: visibleInterventions(entries, { filter, program, search }),
    followError: follow.error instanceof Error ? follow.error : null,
    notifyRow,
    openNotify: setNotifyId,
    closeNotify: () => setNotifyId(null),
    notified: () => {
      if (!notifyRow) return;
      setNotifyId(null);
      showToast({
        title: t("notifiedTitle", { name: notifyRow.coordinatorName }),
        message: t("notifiedBody", { pair: pairLabel(notifyRow) }),
        tone: ToastTone.Success,
      });
    },
    detail,
    openDetail: setDetailId,
    closeDetail: () => setDetailId(null),
    resolved: () => {
      setDetailId(null);
      showToast({ message: t("resolved"), tone: ToastTone.Success });
    },
  };
}

/** The matching tab: waiting, just matched and declined teams, with their filter, search and sort. */
export function useMentorshipMatching(
  data: AdminOverview,
  programs: AdminProgram[],
) {
  const [filter, setFilter] = useState<MatchingFilter>(MatchingFilter.Waiting);
  const [program, setProgram] = useState(ALL_PROGRAMS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MatchingSort>(MatchingSort.Wait);
  const summary = matchingSummary(data, programs);
  return {
    ...summary,
    filter,
    selectFilter: (value: string) => {
      if (isEnumValue(MatchingFilter, value)) setFilter(value);
    },
    program,
    setProgram,
    search,
    setSearch,
    sort,
    selectSort: (value: string) => {
      if (isEnumValue(MatchingSort, value)) setSort(value);
    },
    visible: visibleMatches(summary.rows[filter], { program, search, sort }),
  };
}
