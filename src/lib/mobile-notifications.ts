import { NotificationCategory } from "@/interfaces/notification";
import {
  MOBILE_CALENDAR,
  MOBILE_MESSAGES,
  MOBILE_NOTIFICATIONS,
  MOBILE_STARTUPS,
  MOBILE_TASKS,
  type MobileTexts,
} from "@/lib/mobile";
import type { DashboardNotification } from "@/types/landing";
import { formatDayMonth, relativeDayLabel } from "@/lib/utils";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const TARGETS: Record<NotificationCategory, string> = {
  [NotificationCategory.General]: MOBILE_NOTIFICATIONS,
  [NotificationCategory.Message]: MOBILE_MESSAGES,
  [NotificationCategory.MeetingReminder]: MOBILE_CALENDAR,
  [NotificationCategory.MeetingChange]: MOBILE_CALENDAR,
  [NotificationCategory.TaskAssigned]: MOBILE_TASKS,
  [NotificationCategory.TaskDeadline]: MOBILE_TASKS,
  [NotificationCategory.StartupActivity]: MOBILE_STARTUPS,
  [NotificationCategory.Badge]: MOBILE_NOTIFICATIONS,
};

export type NotificationTone = { icon: string; background: string };

const TONES: Record<NotificationCategory, NotificationTone> = {
  [NotificationCategory.General]: {
    icon: "/mobile/icon-info-muted.svg",
    background: "bg-[#f5f6f8]",
  },
  [NotificationCategory.Message]: {
    icon: "/mobile/notice-message.svg",
    background: "bg-[#eaf6ff]",
  },
  [NotificationCategory.MeetingReminder]: {
    icon: "/mobile/notice-reminder.svg",
    background: "bg-[#f5f6f8]",
  },
  [NotificationCategory.MeetingChange]: {
    icon: "/mobile/notice-change.svg",
    background: "bg-[#fdeeee]",
  },
  [NotificationCategory.TaskAssigned]: {
    icon: "/mobile/notice-task.svg",
    background: "bg-[#fff1ec]",
  },
  [NotificationCategory.TaskDeadline]: {
    icon: "/mobile/notice-deadline.svg",
    background: "bg-[#fff6e5]",
  },
  [NotificationCategory.StartupActivity]: {
    icon: "/mobile/notice-task.svg",
    background: "bg-[#fff1ec]",
  },
  [NotificationCategory.Badge]: {
    icon: "/mobile/icon-info-muted.svg",
    background: "bg-[#f5f6f8]",
  },
};

function isCategory(value: unknown): value is NotificationCategory {
  return Object.values(NotificationCategory).includes(
    value as NotificationCategory,
  );
}

function categoryOf(value: unknown) {
  return isCategory(value) ? value : NotificationCategory.General;
}

/** The phone screen a notification opens; web links are only kept for the web. */
export function mobileTargetFor(category: unknown) {
  return TARGETS[categoryOf(category)];
}

export function notificationTone(category: unknown): NotificationTone {
  return TONES[categoryOf(category)];
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "Şimdi", "12 dk", "3 sa", "Dün", "2 gün", then "12 Eyl". */
export function notificationAge(
  createdAt: string,
  { t, locale }: Pick<MobileTexts, "t" | "locale">,
  now = new Date(),
) {
  const at = new Date(createdAt);
  const elapsed = now.getTime() - at.getTime();
  if (elapsed < MINUTE_MS) return t("notifications.age.now");
  if (elapsed < HOUR_MS) {
    return t("notifications.age.minutes", {
      minutes: Math.floor(elapsed / MINUTE_MS),
    });
  }
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(at).getTime()) / DAY_MS,
  );
  if (days === 0) {
    return t("notifications.age.hours", {
      hours: Math.floor(elapsed / HOUR_MS),
    });
  }
  if (days === 1) return relativeDayLabel(-1, locale);
  if (days < 7) return t("notifications.age.days", { days });
  return formatDayMonth(at, locale);
}

export type NotificationGroup = {
  label: string;
  items: DashboardNotification[];
};

export function groupNotifications(
  notifications: DashboardNotification[],
  t: MobileTexts["t"],
  now = new Date(),
): NotificationGroup[] {
  const today = startOfDay(now).getTime();
  const sorted = notifications
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const groups: NotificationGroup[] = [
    {
      label: t("notifications.today"),
      items: sorted.filter(
        (item) => startOfDay(new Date(item.createdAt)).getTime() === today,
      ),
    },
    {
      label: t("notifications.earlier"),
      items: sorted.filter(
        (item) => startOfDay(new Date(item.createdAt)).getTime() !== today,
      ),
    },
  ];
  return groups.filter((group) => group.items.length > 0);
}
