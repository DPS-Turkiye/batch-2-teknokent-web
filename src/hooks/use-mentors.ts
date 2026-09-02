"use client";

import { useQuery } from "@tanstack/react-query";

import { getMentors } from "@/lib/client/mentors";

export const MENTORS_QUERY_KEY = ["mentors"] as const;

export function useMentors(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: MENTORS_QUERY_KEY,
    queryFn: getMentors,
    enabled: options?.enabled ?? true,
  });
}
