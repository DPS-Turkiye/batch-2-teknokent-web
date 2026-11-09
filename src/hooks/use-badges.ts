"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyBadges, getUserBadges } from "@/lib/client/badges";

export const MY_BADGES_QUERY_KEY = ["badges", "mine"] as const;
export const userBadgesQueryKey = (userId: string) =>
  ["badges", "user", userId] as const;

/** The signed-in person's awards, every status (Profilim › Rozetlerim). */
export function useMyBadges(enabled = true) {
  return useQuery({
    queryKey: MY_BADGES_QUERY_KEY,
    queryFn: getMyBadges,
    enabled,
  });
}

/** Another person's active badges, e.g. for a mentor card. */
export function useUserBadges(userId: string | null) {
  return useQuery({
    queryKey: userBadgesQueryKey(userId ?? ""),
    queryFn: () => getUserBadges(userId ?? ""),
    enabled: Boolean(userId),
  });
}
