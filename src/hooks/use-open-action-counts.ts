"use client";

import { useQueries } from "@tanstack/react-query";

import { actionItemsQueryKey } from "@/hooks/use-action-items";
import { getActionItems } from "@/lib/client/action-items";
import { isOpenActionItem } from "@/lib/mentor-dashboard";

/** How many open action items each mentorship request has, keyed by request id. */
export function useOpenActionCounts(requestIds: string[]) {
  return useQueries({
    queries: requestIds.map((requestId) => ({
      queryKey: actionItemsQueryKey(requestId),
      queryFn: () => getActionItems(requestId),
    })),
    combine: (results) =>
      Object.fromEntries(
        requestIds.map((requestId, index) => [
          requestId,
          (results[index]?.data ?? []).filter(isOpenActionItem).length,
        ]),
      ) as Record<string, number>,
  });
}
