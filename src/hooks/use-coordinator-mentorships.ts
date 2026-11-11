"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCoordinatorNotes } from "@/hooks/use-coordinator-notes";
import { useCoordinatorPrograms } from "@/hooks/use-coordinator-programs";
import { useMentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import {
  getCoordinatorMentorship,
  getCoordinatorMentorships,
  remindCoordinatorMentorship,
} from "@/lib/client/coordinator-mentorships";
import {
  ALL_TOPICS,
  filterMentorships,
  healthFilterOptions,
  MENTORSHIP_PAGE_SIZE,
  MentorshipDrawerTab,
  MentorshipHealthFilter,
  MentorshipSort,
  sortMentorships,
  topicOptions,
} from "@/lib/coordinator-mentorships";
import {
  ALL_PROGRAM_TYPES,
  matchesProgramType,
  type ProgramTypeFilter,
} from "@/lib/program-types";

export const COORDINATOR_MENTORSHIPS_QUERY_KEY = [
  "coordinator-mentorships",
] as const;

export function useCoordinatorMentorships(programId: string | null) {
  return useQuery({
    queryKey: [...COORDINATOR_MENTORSHIPS_QUERY_KEY, programId],
    queryFn: () => getCoordinatorMentorships(programId),
  });
}

/** The Mentorluklar table: program, health, topic and search filters, sort, paging and the open drawer. */
export function useCoordinatorMentorshipList(initialSelectedId: string | null) {
  const t = useTranslations("coordinatorMentorships");
  const programs = useCoordinatorPrograms();
  const [programId, setProgramIdState] = useState<string | null>(null);
  const [type, setTypeState] = useState<ProgramTypeFilter>(ALL_PROGRAM_TYPES);
  const query = useCoordinatorMentorships(programId);
  const [health, setHealthState] = useState(MentorshipHealthFilter.All);
  const [search, setSearchState] = useState("");
  const [topic, setTopicState] = useState(ALL_TOPICS);
  const [sort, setSort] = useState(MentorshipSort.Risk);
  const [limit, setLimit] = useState(MENTORSHIP_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const typeOf = new Map(
    (programs.data ?? []).map((program) => [program.id, program.type]),
  );
  const rows = (query.data ?? []).filter(
    (row) => type === ALL_PROGRAM_TYPES || typeOf.get(row.programId) === type,
  );
  const filtered = sortMentorships(
    filterMentorships(rows, { health, search, topic }),
    sort,
  );
  const resetting =
    <T>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setLimit(MENTORSHIP_PAGE_SIZE);
    };

  return {
    query,
    programOptions: (programs.data ?? []).filter((program) =>
      matchesProgramType(program.type, type),
    ),
    programId,
    setProgramId: resetting(setProgramIdState),
    type,
    /** A type change also clears the program, which may not be of that type. */
    setType: (value: ProgramTypeFilter) => {
      setTypeState(value);
      setProgramIdState(null);
      setLimit(MENTORSHIP_PAGE_SIZE);
    },
    typeOf: (rowProgramId: string) => typeOf.get(rowProgramId) ?? null,
    health,
    setHealth: resetting(setHealthState),
    healthOptions: healthFilterOptions(rows, t),
    search,
    setSearch: resetting(setSearchState),
    topic,
    setTopic: resetting(setTopicState),
    topicOptions: topicOptions(rows),
    sort,
    setSort,
    visible: filtered.slice(0, limit),
    matchCount: filtered.length,
    hasMore: filtered.length > limit,
    showMore: () => setLimit((value) => value + MENTORSHIP_PAGE_SIZE),
    selectedId,
    open: setSelectedId,
    close: () => setSelectedId(null),
  };
}

/** The drawer for one mentorship: its detail, tabs, "İki tarafa hatırlat" and "Görüşme planla". */
export function useCoordinatorMentorshipDrawer(id: string) {
  const [tab, setTab] = useState(MentorshipDrawerTab.Summary);
  const query = useQuery({
    queryKey: [...COORDINATOR_MENTORSHIPS_QUERY_KEY, "detail", id],
    queryFn: () => getCoordinatorMentorship(id),
  });
  const remind = useMutation({
    mutationFn: () => remindCoordinatorMentorship(id),
  });
  const proposals = useMentorshipMeetingProposals(id);
  const notes = useCoordinatorNotes(id);

  return {
    query,
    proposals,
    notes,
    /** The footer's "Koordinatör notu ekle": opens the composer on the Özet tab, where the notes live. */
    addNote: () => {
      setTab(MentorshipDrawerTab.Summary);
      notes.openComposer();
    },
    tab,
    setTab,
    remind: () => remind.mutate(),
    reminding: remind.isPending,
    reminded: remind.isSuccess,
    remindError: remind.error,
  };
}
