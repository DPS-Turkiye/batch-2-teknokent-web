import type {
  CoordinatorConversation,
  CoordinatorMessage,
} from "@/interfaces/coordinator-conversation";
import type { MeetingItem } from "@/interfaces/meeting";
import type {
  MentorshipRequest,
  RequestMessage,
} from "@/interfaces/mentorship-request";
import {
  MobileChatItemKind,
  MobileConversationKind,
  type MobileChatItem,
  type MobileConversation,
} from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";
import {
  conversationTime,
  messageDayLabel,
  messageTime,
} from "@/lib/coordinator-messages";
import { withoutSlotLines } from "@/lib/mentor-availability-days";
import { sharedFileName } from "@/lib/mentorship-messages";
import { mentorshipRequestAllowsMessaging } from "@/lib/mentorship-workspace";
import { mobileChatHref } from "@/lib/mobile";
import { meetingDayAndTime } from "@/lib/mobile-home";
import { initials } from "@/lib/utils";

export type MessagingRole = UserRole.Mentee | UserRole.Mentor;

const NO_MESSAGES_YET = "Henüz mesaj yok";

type ChatLine = {
  id: string;
  createdAt: string;
  mine: boolean;
  body: string;
};

function readBy(line: ChatLine, otherReadAt: string | null | undefined) {
  return line.mine && otherReadAt != null && line.createdAt <= otherReadAt;
}

function fromMentor(request: MentorshipRequest, message: RequestMessage) {
  return message.authorId === request.mentorId;
}

/** Messages from the other side written after the viewer's side last read the thread. */
export function mentorshipUnreadCount(
  request: MentorshipRequest,
  role: MessagingRole,
) {
  const viewerIsMentor = role === UserRole.Mentor;
  const readAt = viewerIsMentor ? request.mentorReadAt : request.menteeReadAt;
  return request.messages.filter(
    (message) =>
      fromMentor(request, message) !== viewerIsMentor &&
      (readAt == null || message.createdAt > readAt),
  ).length;
}

function previewOf(body: string) {
  const fileName = sharedFileName(body);
  return fileName ? `📎 ${fileName}` : withoutSlotLines(body);
}

function latestMessage(request: MentorshipRequest) {
  return request.messages.reduce<RequestMessage | null>(
    (latest, message) =>
      !latest || message.createdAt > latest.createdAt ? message : latest,
    null,
  );
}

export function mentorshipConversation(
  request: MentorshipRequest,
  role: MessagingRole,
  now = new Date(),
): MobileConversation {
  const isStartup = role === UserRole.Mentor;
  const name = isStartup
    ? (request.organizationName ?? request.requesterName ?? "Startup")
    : request.mentorName;
  const last = latestMessage(request);
  const lastAt = last?.createdAt ?? request.createdAt;
  return {
    id: request.id,
    kind: MobileConversationKind.Mentorship,
    name,
    initials: initials(name),
    tag: isStartup ? (request.requesterName ?? "Startup") : "Mentor",
    isStartup,
    lastAt,
    time: conversationTime(lastAt, now),
    // Several requests can share a mentor; the topic tells the empty ones apart.
    preview: last ? previewOf(last.body) : request.supportArea,
    unreadCount: mentorshipUnreadCount(request, role),
    href: mobileChatHref(MobileConversationKind.Mentorship, request.id),
  };
}

// Mentees see one thread per mentor, mentors one per startup; each request's topic is a tab inside it.
function threadKey(request: MentorshipRequest, role: MessagingRole) {
  return role === UserRole.Mentor ? request.organizationId : request.mentorId;
}

/** One row per mentor or startup: the newest thread, with the unread of all its topics. */
export function groupedMentorshipConversations(
  requests: MentorshipRequest[],
  role: MessagingRole,
  now = new Date(),
) {
  const groups = new Map<string, MobileConversation>();
  for (const request of requests) {
    if (!mentorshipRequestAllowsMessaging(request.status)) continue;
    const conversation = mentorshipConversation(request, role, now);
    const key = threadKey(request, role);
    const held = groups.get(key);
    groups.set(
      key,
      !held
        ? conversation
        : {
            ...(conversation.lastAt > held.lastAt ? conversation : held),
            unreadCount: held.unreadCount + conversation.unreadCount,
          },
    );
  }
  return newestFirst([...groups.values()]);
}

export type ThreadTopic = {
  id: string;
  topic: string;
  unreadCount: number;
  href: string;
  isCurrent: boolean;
};

/** The other requests with the same mentor or startup, newest first, to switch between in the chat. */
export function threadTopics(
  requests: MentorshipRequest[],
  current: MentorshipRequest,
  role: MessagingRole,
): ThreadTopic[] {
  const key = threadKey(current, role);
  return newestFirst(
    requests
      .filter(
        (request) =>
          threadKey(request, role) === key &&
          mentorshipRequestAllowsMessaging(request.status),
      )
      .map((request) => mentorshipConversation(request, role)),
  ).map((conversation) => ({
    id: conversation.id,
    topic:
      requests.find((request) => request.id === conversation.id)?.supportArea ??
      "",
    unreadCount: conversation.unreadCount,
    href: conversation.href,
    isCurrent: conversation.id === current.id,
  }));
}

export function programConversation(
  conversation: CoordinatorConversation,
  now = new Date(),
): MobileConversation {
  return {
    id: conversation.id,
    kind: MobileConversationKind.Program,
    name: conversation.programName,
    initials: initials(conversation.programName),
    tag: "Program",
    isStartup: false,
    lastAt: conversation.lastMessageAt ?? "",
    time: conversationTime(conversation.lastMessageAt, now),
    preview: conversation.lastMessagePreview ?? NO_MESSAGES_YET,
    unreadCount: conversation.unreadCount ?? (conversation.unread ? 1 : 0),
    href: mobileChatHref(MobileConversationKind.Program, conversation.id),
  };
}

export function newestFirst(conversations: MobileConversation[]) {
  return conversations
    .slice()
    .sort((left, right) => right.lastAt.localeCompare(left.lastAt));
}

export function searchConversations(
  conversations: MobileConversation[],
  query: string,
) {
  const needle = query.trim().toLocaleLowerCase("tr-TR");
  if (!needle) return conversations;
  // A startup thread is also found by the person who wrote in.
  return conversations.filter((conversation) =>
    [conversation.name, conversation.isStartup ? conversation.tag : ""].some(
      (text) => text.toLocaleLowerCase("tr-TR").includes(needle),
    ),
  );
}

function withDaySeparators(
  lines: ChatLine[],
  otherReadAt: string | null | undefined,
  now: Date,
): MobileChatItem[] {
  const items: MobileChatItem[] = [];
  let lastDay = "";
  for (const line of lines) {
    const day = messageDayLabel(line.createdAt, now);
    if (day !== lastDay) {
      items.push({
        kind: MobileChatItemKind.Day,
        id: `day-${line.createdAt}`,
        label: day,
      });
      lastDay = day;
    }
    items.push({
      kind: MobileChatItemKind.Message,
      id: line.id,
      mine: line.mine,
      body: line.body,
      fileName: sharedFileName(line.body),
      time: messageTime(line.createdAt),
      read: readBy(line, otherReadAt),
    });
  }
  return items;
}

/** Ticks show on the viewer's own messages once the other side has read past them. */
export function mentorshipChatItems(
  request: MentorshipRequest,
  role: MessagingRole,
  viewerId: string,
  now = new Date(),
) {
  const otherReadAt =
    role === UserRole.Mentor ? request.menteeReadAt : request.mentorReadAt;
  const lines = request.messages
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((message) => ({
      id: message.id,
      createdAt: message.createdAt,
      mine: message.authorId === viewerId,
      body: withoutSlotLines(message.body),
    }));
  return withDaySeparators(lines, otherReadAt, now);
}

export function programChatItems(
  messages: CoordinatorMessage[],
  otherSideReadAt: string | null | undefined,
  now = new Date(),
) {
  return withDaySeparators(messages, otherSideReadAt, now);
}

/** Mentors: "METU Stars 2026 · Gamze Kozak", or the topic when no program is known. */
export function mentorshipChatSubtitle(
  request: MentorshipRequest,
  role: MessagingRole,
  programName: string | null = null,
) {
  if (role !== UserRole.Mentor) return `Mentor · ${request.supportArea}`;
  return [
    programName,
    request.requesterName,
    programName ? null : request.supportArea,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function nextMeetingStrip(meeting: MeetingItem, now = new Date()) {
  const when = meetingDayAndTime(meeting, now);
  return `Sıradaki görüşme: ${when.day} ${when.time}`;
}
