"use client";

import { useQuery } from "@tanstack/react-query";

import { getMemberProgramEvents } from "@/lib/client/programs";

export const MEMBER_PROGRAM_EVENTS_QUERY_KEY = "member-program-events";

/**
 * The program entries of the caller's programs in a range: events and deadlines, the weekly plan's special days, and
 * its sessions once their week has begun (the backend decides; nothing of a future week arrives).
 */
export function useMemberProgramEvents(range: { from: Date; to: Date }) {
  return useQuery({
    queryKey: [MEMBER_PROGRAM_EVENTS_QUERY_KEY, range],
    queryFn: () => getMemberProgramEvents(range),
  });
}
