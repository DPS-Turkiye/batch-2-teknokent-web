"use client";

import { useMemo } from "react";

import { useActionItemsForRequests } from "@/hooks/use-action-items";
import { isOpenActionItem } from "@/lib/mentor-dashboard";

/** How many open action items each mentorship request has, keyed by request id. */
export function useOpenActionCounts(requestIds: string[]) {
  // Callers pass a fresh array each render; keying on the ids keeps the result stable.
  const idsKey = requestIds.join(",");
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);
  const { byRequest } = useActionItemsForRequests(ids);
  return useMemo(
    () =>
      Object.fromEntries(
        ids.map((requestId, index) => [
          requestId,
          (byRequest[index] ?? []).filter(isOpenActionItem).length,
        ]),
      ) as Record<string, number>,
    [ids, byRequest],
  );
}
