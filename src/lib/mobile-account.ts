import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/interfaces/notification";
import { UserRole, type AppSession } from "@/interfaces/session";
import { webHref, type MobileTexts } from "@/lib/mobile";

/** A switch's label and hint are `accountDialogs.preferences.{key}`, shared with the web menu. */
export type PreferenceRow = { key: NotificationPreferenceKey };

const MENTEE_ROWS: PreferenceRow[] = [
  { key: "messages" },
  { key: "meetingReminders" },
  { key: "newTasks" },
  { key: "taskDeadlines" },
];

const MENTOR_ROWS: PreferenceRow[] = [
  { key: "messages" },
  { key: "meetingReminders" },
  { key: "meetingChanges" },
  { key: "startupActivity" },
];

// Coordinators and admins only get messages; their other notices are GENERAL, which cannot be muted.
const STAFF_ROWS: PreferenceRow[] = [{ key: "messages" }];

export function preferenceRowsFor(role?: UserRole | null) {
  if (role === UserRole.Mentor) return MENTOR_ROWS;
  if (role === UserRole.Coordinator || role === UserRole.Admin) {
    return STAFF_ROWS;
  }
  return MENTEE_ROWS;
}

export function toggledPreferences(
  preferences: NotificationPreferences,
  key: NotificationPreferenceKey,
): NotificationPreferences {
  return { ...preferences, [key]: !preferences[key] };
}

/** "Atlas AI · Takım yetkilisi" for a mentee, "Mentor · UX/UI" for a mentor. */
export function accountChip(session: AppSession, t: MobileTexts["t"]) {
  if (session.role !== UserRole.Mentor) {
    return [session.organizationName, session.jobTitle]
      .filter(Boolean)
      .join(" · ");
  }
  // A mentor whose title is just "Mentor" would read "Mentor · Mentor".
  const title = session.jobTitle.trim();
  const mentor = t("meeting.mentor");
  return title && title.toLocaleLowerCase("tr-TR") !== "mentor"
    ? `${mentor} · ${title}`
    : mentor;
}

export function accountAvatarClass(role?: UserRole | null) {
  return role === UserRole.Mentor
    ? "bg-[#eaf6ff] text-[#1583d6]"
    : "bg-[#fff1ec] text-[#e0522a]";
}

export function webEditLinkFor(
  role: UserRole | null | undefined,
  t: MobileTexts["t"],
) {
  return role === UserRole.Mentor
    ? {
        title: t("account.webEditMentor"),
        hint: t("account.webEditMentorHint"),
        href: webHref("/mentor-profile"),
      }
    : {
        title: t("account.webEditMentee"),
        hint: t("account.webEditMenteeHint"),
        href: webHref("/profile"),
      };
}
