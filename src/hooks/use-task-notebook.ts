"use client";

import { useState } from "react";

import {
  useActionItems,
  useChangeActionItemStatus,
} from "@/hooks/use-action-items";
import { type ActionItem, ActionItemStatus } from "@/interfaces/action-item";
import type { HomeTask } from "@/lib/mentee-home";

/** Which home task's notebook popup is open. */
export function useHomeTaskNotebook() {
  const [task, setTask] = useState<HomeTask | null>(null);
  return {
    task,
    open: (next: HomeTask) => setTask(next),
    close: () => setTask(null),
  };
}

/** A mentorship's tasks for the notebook popup, ticked straight from it. */
export function useTaskNotebook(requestId: string) {
  const query = useActionItems(requestId);
  const change = useChangeActionItemStatus();
  const items = (query.data ?? [])
    .filter((item) => item.status !== ActionItemStatus.Cancelled)
    .sort(
      (left, right) =>
        Number(left.status === ActionItemStatus.Completed) -
        Number(right.status === ActionItemStatus.Completed),
    );
  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    toggle: (item: ActionItem, done: boolean) =>
      change.mutate({
        id: item.id,
        status: done ? ActionItemStatus.Completed : ActionItemStatus.Open,
      }),
  };
}
