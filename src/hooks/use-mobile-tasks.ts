"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import {
  ACTION_ITEMS_QUERY_KEY,
  useActionItemsForRequests,
} from "@/hooks/use-action-items";
import { useDismissedHomeTasks } from "@/hooks/use-dismissed-home-tasks";
import { useMeetings } from "@/hooks/use-meetings";
import { useMeetingsAwaitingFeedback } from "@/hooks/use-meetings-awaiting-feedback";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { MEMBER_PROGRAM_EVENTS_QUERY_KEY } from "@/hooks/use-mobile-calendar";
import { useMobileTexts } from "@/hooks/use-mobile-texts";
import { STARTUP_PROCESS_QUERY_KEY } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { MobileTaskSource, type MobileTask } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import { changeActionItemStatus } from "@/lib/client/action-items";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { getStartupProcess } from "@/lib/client/startup-process";
import { homeTaskId } from "@/lib/mentee-home";
import {
  collectTasks,
  completedTasks,
  groupOpenTasks,
} from "@/lib/mobile-tasks";
import { heldMeetingsNewestFirst } from "@/lib/startup-meetings";
import { HomeTaskKind } from "@/types/mentee-home";

export enum MobileTaskTab {
  Open = "open",
  Done = "done",
}

const DEADLINE_WINDOW_DAYS = 60;
const TOAST_MS = 5_000;
const ACTION_PREFIX = "action:";

function deadlineWindow() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + DEADLINE_WINDOW_DAYS);
  return { from, to };
}

export function useMobileTasks() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(MobileTaskTab.Open);
  const [openId, setOpenId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<MobileTask | null>(null);
  const [range] = useState(deadlineWindow);
  const texts = useMobileTexts();

  const requests = useMentorshipRequests(UserRole.Mentee);
  const accepted = useMemo(
    () =>
      (requests.data ?? []).filter(
        (request) => request.status === MentorshipRequestStatus.Accepted,
      ),
    [requests.data],
  );
  const actionItems = useActionItemsForRequests(
    accepted.map((request) => request.id),
  );
  // A mentee outside a startup has no process; that is not an error here.
  const process = useQuery({
    queryKey: STARTUP_PROCESS_QUERY_KEY,
    queryFn: getStartupProcess,
    retry: false,
  });
  const deadlines = useQuery({
    queryKey: [MEMBER_PROGRAM_EVENTS_QUERY_KEY, range],
    queryFn: () => getMemberProgramEvents(range),
  });
  // Home hides a rating the mentee dismissed on the web, so this list does too.
  const { session } = useSession();
  const { dismissedTaskIds } = useDismissedHomeTasks(session?.userId);
  const meetings = useMeetings();
  const { feedbackMeetings, isLoadingFeedback } = useMeetingsAwaitingFeedback(
    heldMeetingsNewestFirst(meetings.data ?? []),
  );
  const unratedMeetings = feedbackMeetings.filter(
    (meeting) =>
      !dismissedTaskIds.includes(
        homeTaskId(HomeTaskKind.MeetingFeedback, meeting.id),
      ),
  );

  const tasks = useMemo(
    () =>
      collectTasks(
        {
          actionItemsByRequest: accepted.map((request, index) => ({
            request,
            items: actionItems.byRequest[index] ?? [],
          })),
          assignments: process.data?.assignments ?? [],
          deadlines: deadlines.data ?? [],
          feedbackMeetings: unratedMeetings,
        },
        new Date(),
        texts,
      ),
    [
      accepted,
      actionItems.byRequest,
      process.data,
      deadlines.data,
      unratedMeetings,
      texts,
    ],
  );
  const groups = groupOpenTasks(tasks, new Date(), texts.t);
  const done = completedTasks(tasks);

  const setStatus = useMutation({
    mutationFn: (input: { task: MobileTask; status: ActionItemStatus }) =>
      changeActionItemStatus({
        id: input.task.id.slice(ACTION_PREFIX.length),
        status: input.status,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACTION_ITEMS_QUERY_KEY }),
  });

  useEffect(() => {
    if (!justCompleted) return;
    const timer = window.setTimeout(() => setJustCompleted(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [justCompleted]);

  const canTick = (task: MobileTask) =>
    task.source === MobileTaskSource.Mentorship && Boolean(task.requestId);

  const complete = (task: MobileTask) => {
    if (!canTick(task)) return;
    setOpenId(null);
    setStatus.mutate(
      { task, status: ActionItemStatus.Completed },
      { onSuccess: () => setJustCompleted(task) },
    );
  };

  const reopen = (task: MobileTask) => {
    if (!canTick(task)) return;
    setJustCompleted(null);
    setStatus.mutate({ task, status: ActionItemStatus.Open });
  };

  return {
    canTick,
    closeTask: () => setOpenId(null),
    complete,
    counts: {
      open: groups.reduce((total, group) => total + group.tasks.length, 0),
      done: done.length,
    },
    done,
    groups,
    isError: Boolean(requests.error),
    isLoading: requests.isLoading || actionItems.isLoading || isLoadingFeedback,
    isSaving: setStatus.isPending,
    justCompleted,
    openTask: (id: string) => setOpenId(id),
    reopen,
    retry: () => void requests.refetch(),
    saveFailed: Boolean(setStatus.error),
    selected: tasks.find((task) => task.id === openId) ?? null,
    setTab,
    tab,
    undo: () => {
      if (justCompleted) reopen(justCompleted);
    },
  };
}
