"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useCoordinatorPrograms } from "@/hooks/use-coordinator-programs";
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
  const programs = useCoordinatorPrograms();
  const [programId, setProgramIdState] = useState<string | null>(null);
  const query = useCoordinatorMentorships(programId);
  const [health, setHealthState] = useState(MentorshipHealthFilter.All);
  const [search, setSearchState] = useState("");
  const [topic, setTopicState] = useState(ALL_TOPICS);
  const [sort, setSort] = useState(MentorshipSort.Risk);
  const [limit, setLimit] = useState(MENTORSHIP_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const rows = query.data ?? [];
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
    programOptions: programs.data ?? [],
    programId,
    setProgramId: resetting(setProgramIdState),
    health,
    setHealth: resetting(setHealthState),
    healthOptions: healthFilterOptions(rows),
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

/** The drawer for one mentorship: its detail, tabs and the "İki tarafa hatırlat" action. */
export function useCoordinatorMentorshipDrawer(id: string) {
  const [tab, setTab] = useState(MentorshipDrawerTab.Summary);
  const query = useQuery({
    queryKey: [...COORDINATOR_MENTORSHIPS_QUERY_KEY, "detail", id],
    queryFn: () => getCoordinatorMentorship(id),
  });
  const remind = useMutation({
    mutationFn: () => remindCoordinatorMentorship(id),
  });

  return {
    query,
    tab,
    setTab,
    remind: () => remind.mutate(),
    reminding: remind.isPending,
    reminded: remind.isSuccess,
    remindError: remind.error,
  };
}
