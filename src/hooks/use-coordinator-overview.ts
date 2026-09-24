"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getCoordinatorOverview } from "@/lib/client/coordinator-overview";
import { agendaForToday, AgendaWindow } from "@/lib/coordinator-home";

export const COORDINATOR_OVERVIEW_QUERY_KEY = ["coordinator-overview"] as const;

/** The coordinator home: one program or all, and today's or this week's agenda. */
export function useCoordinatorHome() {
  const [programId, setProgramId] = useState<string | null>(null);
  const [agendaWindow, setAgendaWindow] = useState(AgendaWindow.Week);
  const query = useQuery({
    queryKey: [...COORDINATOR_OVERVIEW_QUERY_KEY, programId],
    queryFn: () => getCoordinatorOverview(programId),
  });
  const agenda = query.data?.agenda ?? [];
  const today = agendaForToday(agenda);

  return {
    query,
    programId,
    setProgramId,
    agendaWindow,
    setAgendaWindow,
    todayCount: today.length,
    weekCount: agenda.length,
    visibleAgenda: agendaWindow === AgendaWindow.Today ? today : agenda,
  };
}
