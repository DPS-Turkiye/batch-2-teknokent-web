"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { PROGRAMS_QUERY_KEY } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import { getRegularMentorships } from "@/lib/client/mentorships";
import { getPrograms } from "@/lib/client/programs";
import { activeStartupCards, pastStartupCards } from "@/lib/mobile-startups";

export enum StartupTab {
  Active = "active",
  Past = "past",
}

export const MENTOR_REGULAR_MENTORSHIPS_QUERY_KEY = [
  "regular-mentorships",
  UserRole.Mentor,
] as const;

export function useMobileStartups() {
  const { session } = useSession();
  const [tab, setTab] = useState(StartupTab.Active);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const requests = useMentorshipRequests(UserRole.Mentor);
  const meetings = useMeetings();
  const programs = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    retry: false,
  });
  const mentorships = useQuery({
    queryKey: MENTOR_REGULAR_MENTORSHIPS_QUERY_KEY,
    queryFn: () => getRegularMentorships(UserRole.Mentor),
    retry: false,
  });

  const { active, past } = useMemo(() => {
    const activeCards = activeStartupCards(
      requests.data ?? [],
      meetings.data ?? [],
      programs.data ?? [],
      session?.userId ?? "",
    );
    return {
      active: activeCards,
      past: pastStartupCards(
        mentorships.data ?? [],
        new Set(activeCards.map((card) => card.id)),
      ),
    };
  }, [requests.data, meetings.data, programs.data, mentorships.data, session]);

  const needle = query.trim().toLocaleLowerCase("tr-TR");
  const shown = (tab === StartupTab.Active ? active : past).filter(
    (card) => !needle || card.name.toLocaleLowerCase("tr-TR").includes(needle),
  );

  return {
    counts: { active: active.length, past: past.length },
    isError: Boolean(requests.error),
    isLoading: requests.isLoading || meetings.isLoading,
    isSearching,
    query,
    retry: () => void requests.refetch(),
    setQuery,
    setTab,
    shown,
    tab,
    toggleSearch: () => {
      setIsSearching((open) => !open);
      setQuery("");
    },
  };
}
