"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import type { ActionItem } from "@/interfaces/action-item";
import {
  addActionItem,
  changeActionItemStatus,
  getActionItems,
  getActionItemsForRequests,
} from "@/lib/client/action-items";

export const ACTION_ITEMS_QUERY_KEY = ["action-items"] as const;

export function actionItemsQueryKey(requestId: string) {
  return [...ACTION_ITEMS_QUERY_KEY, requestId] as const;
}

/**
 * Overviews that list several requests' tasks load them in one call. `byRequest` follows the order of
 * `requestIds`.
 */
export function useActionItemsForRequests(requestIds: string[]) {
  // Callers often pass a fresh array each render; keying on the ids keeps the result stable.
  const idsKey = requestIds.join(",");
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);
  const query = useQuery({
    queryKey: [...ACTION_ITEMS_QUERY_KEY, "requests", ids],
    queryFn: () => getActionItemsForRequests(ids),
    enabled: ids.length > 0,
  });
  const byRequest = useMemo<ActionItem[][]>(
    () =>
      ids.map((id) =>
        (query.data ?? []).filter((item) => item.mentorshipRequestId === id),
      ),
    [ids, query.data],
  );
  return { byRequest, isLoading: query.isLoading, isError: query.isError };
}

export function useActionItems(requestId: string | undefined) {
  return useQuery({
    queryKey: actionItemsQueryKey(requestId ?? ""),
    queryFn: () => getActionItems(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useAddActionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addActionItem,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ACTION_ITEMS_QUERY_KEY,
      }),
  });
}

export function useChangeActionItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeActionItemStatus,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ACTION_ITEMS_QUERY_KEY,
      }),
  });
}
