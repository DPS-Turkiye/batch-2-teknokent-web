"use client";

import { type UseQueryResult, useQueries } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { actionItemsQueryKey } from "@/hooks/use-action-items";
import { getActionItems } from "@/lib/client/action-items";
import { isOpenActionItem } from "@/lib/mentor-dashboard";

type ActionItemsResult = UseQueryResult<
  Awaited<ReturnType<typeof getActionItems>>
>;

/** How many open action items each mentorship request has, keyed by request id. */
export function useOpenActionCounts(requestIds: string[]) {
  // Callers pass a fresh array each render; keying on the ids keeps the queries
  // and `combine` stable, so its result only changes when the counts do.
  const idsKey = requestIds.join(",");
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);
  const combine = useCallback(
    (results: ActionItemsResult[]) =>
      Object.fromEntries(
        ids.map((requestId, index) => [
          requestId,
          (results[index]?.data ?? []).filter(isOpenActionItem).length,
        ]),
      ) as Record<string, number>,
    [ids],
  );

  return useQueries({
    queries: ids.map((requestId) => ({
      queryKey: actionItemsQueryKey(requestId),
      queryFn: () => getActionItems(requestId),
    })),
    combine,
  });
}
