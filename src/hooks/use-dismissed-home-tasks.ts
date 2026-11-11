"use client";

import { useCallback, useState } from "react";

import {
  readDismissedHomeTasks,
  writeDismissedHomeTasks,
} from "@/lib/mentee-home";

export function useDismissedHomeTasks(userId: string | undefined) {
  // Bumped after a write so the hook renders again and re-reads the stored list.
  const [, setRevision] = useState(0);
  const dismissedTaskIds = userId ? readDismissedHomeTasks(userId) : [];

  const dismissHomeTask = useCallback(
    (taskId: string) => {
      if (!userId) return;
      const current = readDismissedHomeTasks(userId);
      if (current.includes(taskId)) return;
      writeDismissedHomeTasks(userId, [...current, taskId]);
      setRevision((value) => value + 1);
    },
    [userId],
  );

  return { dismissedTaskIds, dismissHomeTask };
}
