"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getTeamHistory } from "@/lib/client/team-changes";

export const teamHistoryQueryKey = (userId: string) =>
  ["team-history", userId] as const;

/** A person's startups over time; loads only once the list is opened. */
export function useTeamHistory(userId: string) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: teamHistoryQueryKey(userId),
    queryFn: () => getTeamHistory(userId),
    enabled: open,
  });
  return { open, toggle: () => setOpen((value) => !value), query };
}
