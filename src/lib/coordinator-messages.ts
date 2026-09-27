import {
  type CoordinatorConversation,
  CoordinatorConversationCounterpart,
} from "@/interfaces/coordinator-conversation";
import {
  type CoordinatorMentorship,
  CoordinatorMentorshipHealth,
} from "@/interfaces/coordinator-mentorship";
import { formatDayMonth } from "@/lib/utils";

export enum MessageFilter {
  All = "ALL",
  Mentors = "MENTORS",
  Teams = "TEAMS",
  Announcements = "ANNOUNCEMENTS",
}

export const COUNTERPART_LABELS: Record<
  CoordinatorConversationCounterpart,
  string
> = {
  [CoordinatorConversationCounterpart.Mentor]: "Mentor",
  [CoordinatorConversationCounterpart.Team]: "Takım",
};

const COUNTERPART_OF_FILTER: Record<
  Exclude<MessageFilter, MessageFilter.All | MessageFilter.Announcements>,
  CoordinatorConversationCounterpart
> = {
  [MessageFilter.Mentors]: CoordinatorConversationCounterpart.Mentor,
  [MessageFilter.Teams]: CoordinatorConversationCounterpart.Team,
};

/** The open thread counts as read: the backend marks it when its messages load. */
export function isUnread(
  conversation: CoordinatorConversation,
  openId: string | null,
) {
  return conversation.unread && conversation.id !== openId;
}

/** "Tümü · Mentorlar 1 · Takımlar 2", counting unread threads. */
export function messageFilterOptions(
  conversations: CoordinatorConversation[],
  openId: string | null,
) {
  const unread = (type: CoordinatorConversationCounterpart) =>
    conversations.filter(
      (item) => item.counterpartType === type && isUnread(item, openId),
    ).length;
  return [
    { id: MessageFilter.All, label: "Tümü" },
    {
      id: MessageFilter.Mentors,
      label: `Mentorlar ${unread(CoordinatorConversationCounterpart.Mentor)}`,
    },
    {
      id: MessageFilter.Teams,
      label: `Takımlar ${unread(CoordinatorConversationCounterpart.Team)}`,
    },
    { id: MessageFilter.Announcements, label: "Duyurular" },
  ];
}

export function filterConversations(
  conversations: CoordinatorConversation[],
  {
    filter,
    search,
    programId,
  }: { filter: MessageFilter; search: string; programId: string | null },
) {
  if (filter === MessageFilter.Announcements) return [];
  const needle = search.trim().toLocaleLowerCase("tr");
  return conversations.filter(
    (item) =>
      (filter === MessageFilter.All ||
        item.counterpartType === COUNTERPART_OF_FILTER[filter]) &&
      (!programId || item.programId === programId) &&
      (!needle ||
        [item.counterpartName, item.programName, item.lastMessagePreview ?? ""]
          .join(" ")
          .toLocaleLowerCase("tr")
          .includes(needle)),
  );
}

/** The table rows the counterpart takes part in, within the thread's program. */
export function relatedMentorships(
  conversation: CoordinatorConversation,
  mentorships: CoordinatorMentorship[],
) {
  return mentorships.filter(
    (row) =>
      row.programId === conversation.programId &&
      (conversation.counterpartType ===
      CoordinatorConversationCounterpart.Mentor
        ? row.mentorId === conversation.counterpartId
        : row.organizationId === conversation.counterpartId),
  );
}

/** "Mentor · Lumen, Kavun" or "Takım · Ayşe Demir". */
export function counterpartSubtitle(
  conversation: CoordinatorConversation,
  related: CoordinatorMentorship[],
) {
  const names = related.map((row) =>
    conversation.counterpartType === CoordinatorConversationCounterpart.Mentor
      ? row.organizationName
      : row.mentorName,
  );
  const label = COUNTERPART_LABELS[conversation.counterpartType];
  return names.length > 0 ? `${label} · ${names.join(", ")}` : label;
}

/** "3 okunmamış mesaj · 1 konuşma riskli bir mentorlukla ilgili". */
export function messagesSubtitle(
  conversations: CoordinatorConversation[],
  mentorships: CoordinatorMentorship[],
  openId: string | null,
) {
  const unread = conversations.filter((item) => isUnread(item, openId)).length;
  const risky = conversations.filter((item) =>
    relatedMentorships(item, mentorships).some(
      (row) => row.health === CoordinatorMentorshipHealth.Risky,
    ),
  ).length;
  const parts = [`${unread} okunmamış mesaj`];
  if (risky > 0) parts.push(`${risky} konuşma riskli bir mentorlukla ilgili`);
  return parts.join(" · ");
}

const TIME = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});
const WEEKDAY = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(value: Date, now: Date) {
  return Math.round(
    (startOfDay(now).getTime() - startOfDay(value).getTime()) / 86_400_000,
  );
}

/** "10:24" today, "Dün", "Pzt" within the week, then "12 Eyl". */
export function conversationTime(value: string | null, now = new Date()) {
  if (!value) return "";
  const at = new Date(value);
  const days = daysAgo(at, now);
  if (days <= 0) return TIME.format(at);
  if (days === 1) return "Dün";
  if (days < 7) return WEEKDAY.format(at).replace(".", "");
  return formatDayMonth(at);
}

/** The separator above a day's messages: "Bugün", "Dün" or "12 Eyl". */
export function messageDayLabel(value: string, now = new Date()) {
  const days = daysAgo(new Date(value), now);
  if (days <= 0) return "Bugün";
  if (days === 1) return "Dün";
  return formatDayMonth(new Date(value));
}

export function messageTime(value: string) {
  return TIME.format(new Date(value));
}

export const MAX_MESSAGE_LENGTH = 4000;
