"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addActionItem,
  changeActionItemStatus,
  getActionItems,
} from "@/lib/client/action-items";

export function actionItemsQueryKey(requestId: string) {
  return ["action-items", requestId] as const;
}

export function useActionItems(requestId: string | undefined) {
  return useQuery({
    queryKey: actionItemsQueryKey(requestId ?? ""),
    queryFn: () => getActionItems(requestId as string),
    enabled: Boolean(requestId),
  });
}

export function useAddActionItem(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addActionItem,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: actionItemsQueryKey(requestId),
      }),
  });
}

export function useChangeActionItemStatus(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeActionItemStatus,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: actionItemsQueryKey(requestId),
      }),
  });
}
