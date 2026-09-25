"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/providers/session-provider";
import { COORDINATOR_CONVERSATIONS_QUERY_KEY } from "@/hooks/use-coordinator-messages";
import { useMeetings } from "@/hooks/use-meetings";
import { messagingRoleFor } from "@/hooks/use-mobile-messages";
import { PROGRAMS_QUERY_KEY } from "@/hooks/use-programs";
import {
  mentorshipRequestsQueryKey,
  useRequestFileUpload,
} from "@/hooks/use-mentorship-requests";
import { MobileConversationKind } from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  getCoordinatorConversations,
  getCoordinatorMessages,
  sendCoordinatorMessage,
} from "@/lib/client/coordinator-conversations";
import {
  getMentorRequest,
  markMentorRequestRead,
  postMentorMessage,
  replyToMentorRequest,
} from "@/lib/client/mentor-requests";
import { getPrograms } from "@/lib/client/programs";
import {
  isMeetingEnded,
  mentorshipRequestAllowsMessaging,
  pickRequestMeeting,
} from "@/lib/mentorship-workspace";
import { MOBILE_CALENDAR, MOBILE_MESSAGES } from "@/lib/mobile";
import {
  mentorshipChatItems,
  mentorshipChatSubtitle,
  mentorshipConversation,
  mentorshipUnreadCount,
  nextMeetingStrip,
  programChatItems,
} from "@/lib/mobile-messages";
import { programNameFor } from "@/lib/mobile-mentor-home";
import { initials } from "@/lib/utils";

const POLL_MS = 10_000;
export const MAX_CHAT_MESSAGE_LENGTH = 4000;

const mentorshipRequestKey = (id: string) => ["mentorship-request", id];

export function useMobileChat(kind: MobileConversationKind, id: string) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const role = messagingRoleFor(session?.role);
  const viewerId = session?.userId ?? "";
  const isMentorship = kind === MobileConversationKind.Mentorship;
  const [draft, setDraft] = useState("");

  const request = useQuery({
    queryKey: mentorshipRequestKey(id),
    queryFn: () => getMentorRequest(id),
    enabled: isMentorship,
    refetchInterval: POLL_MS,
  });
  const programs = useQuery({
    queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    queryFn: () => getCoordinatorConversations(),
    enabled: !isMentorship,
    refetchInterval: POLL_MS,
  });
  const programMessages = useQuery({
    queryKey: [...COORDINATOR_CONVERSATIONS_QUERY_KEY, "messages", id],
    queryFn: () => getCoordinatorMessages(id),
    enabled: !isMentorship,
    refetchInterval: POLL_MS,
  });
  // Only names the startup's program in a mentor's header; a failure just leaves it out.
  const startupPrograms = useQuery({
    queryKey: PROGRAMS_QUERY_KEY,
    queryFn: getPrograms,
    enabled: isMentorship && role === UserRole.Mentor,
    retry: false,
  });
  const meetings = useMeetings();
  const upload = useRequestFileUpload(isMentorship ? id : null, role);

  const refreshLists = () => {
    void queryClient.invalidateQueries({
      queryKey: mentorshipRequestsQueryKey(role),
    });
    void queryClient.invalidateQueries({
      queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
    });
  };

  const { mutate: markRead } = useMutation({
    mutationFn: () => markMentorRequestRead(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(mentorshipRequestKey(id), updated);
      void queryClient.invalidateQueries({
        queryKey: mentorshipRequestsQueryKey(role),
      });
    },
  });
  const unread =
    isMentorship && request.data
      ? mentorshipUnreadCount(request.data, role)
      : 0;
  useEffect(() => {
    if (unread > 0) markRead();
  }, [unread, markRead]);

  // Opening a program thread marks it read on the server; the list only needs refreshing.
  const program = programs.data?.find((item) => item.id === id) ?? null;
  const programUnread = program?.unread ?? false;
  useEffect(() => {
    if (programMessages.dataUpdatedAt && programUnread) {
      void queryClient.invalidateQueries({
        queryKey: COORDINATOR_CONVERSATIONS_QUERY_KEY,
      });
    }
  }, [programMessages.dataUpdatedAt, programUnread, queryClient]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      if (!isMentorship) {
        await sendCoordinatorMessage(id, body);
        return;
      }
      const post =
        role === UserRole.Mentor ? postMentorMessage : replyToMentorRequest;
      queryClient.setQueryData(
        mentorshipRequestKey(id),
        await post({ id, message: body }),
      );
    },
    onSuccess: () => {
      setDraft("");
      if (!isMentorship) {
        void queryClient.invalidateQueries({
          queryKey: [...COORDINATOR_CONVERSATIONS_QUERY_KEY, "messages", id],
        });
      }
      refreshLists();
    },
  });

  const header = useMemo(() => {
    if (isMentorship && request.data) {
      const conversation = mentorshipConversation(request.data, role);
      const programName = conversation.isStartup
        ? programNameFor(
            startupPrograms.data ?? [],
            request.data.organizationId,
            viewerId,
          )
        : null;
      return {
        name: conversation.name,
        initials: conversation.initials,
        isStartup: conversation.isStartup,
        subtitle: mentorshipChatSubtitle(request.data, role, programName),
      };
    }
    if (!isMentorship && program) {
      return {
        name: program.programName,
        initials: initials(program.programName),
        isStartup: false,
        subtitle: `Koordinatör · ${program.coordinatorName}`,
      };
    }
    return null;
  }, [
    isMentorship,
    request.data,
    program,
    role,
    startupPrograms.data,
    viewerId,
  ]);

  const items = useMemo(() => {
    if (isMentorship) {
      return request.data
        ? mentorshipChatItems(request.data, role, viewerId)
        : [];
    }
    return programChatItems(
      programMessages.data ?? [],
      program?.otherSideReadAt,
    );
  }, [
    isMentorship,
    request.data,
    role,
    viewerId,
    programMessages.data,
    program?.otherSideReadAt,
  ]);

  const meeting =
    isMentorship && request.data
      ? pickRequestMeeting(meetings.data ?? [], request.data)
      : null;
  const strip =
    meeting && !isMeetingEnded(meeting)
      ? {
          label: nextMeetingStrip(meeting),
          href: `${MOBILE_CALENDAR}?meeting=${encodeURIComponent(meeting.id)}`,
        }
      : null;

  const isLoading = isMentorship
    ? request.isLoading
    : programs.isLoading || programMessages.isLoading;
  const isError = isMentorship
    ? Boolean(request.error)
    : Boolean(programMessages.error);

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(body);
  };

  return {
    backHref: MOBILE_MESSAGES,
    canAttach: isMentorship,
    canSend: isMentorship
      ? Boolean(
          request.data && mentorshipRequestAllowsMessaging(request.data.status),
        )
      : true,
    attach: (file: File) => upload.mutate(file),
    draft,
    header,
    isError,
    isLoading,
    isSending: send.isPending,
    isUploading: upload.isPending,
    items,
    notFound: !isLoading && !isError && !header,
    retry: () => {
      void request.refetch();
      void programMessages.refetch();
    },
    sendError: Boolean(send.error || upload.error),
    setDraft,
    strip,
    submit,
  };
}
