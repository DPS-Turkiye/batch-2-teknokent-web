import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/interfaces/notification";
import { type AppSession, UserRole } from "@/interfaces/session";
import { webHref } from "@/lib/mobile";

export type PreferenceRow = {
  key: NotificationPreferenceKey;
  label: string;
  hint?: string;
};

const MENTEE_ROWS: PreferenceRow[] = [
  { key: "messages", label: "Mesajlar" },
  {
    key: "meetingReminders",
    label: "Görüşme hatırlatmaları",
    hint: "30 dk önce",
  },
  { key: "newTasks", label: "Yeni görev atandığında" },
  { key: "taskDeadlines", label: "Görev son tarihi", hint: "1 gün önce" },
];

const MENTOR_ROWS: PreferenceRow[] = [
  { key: "messages", label: "Mesajlar" },
  {
    key: "meetingReminders",
    label: "Görüşme hatırlatmaları",
    hint: "30 dk önce",
  },
  { key: "meetingChanges", label: "Görüşme değişiklikleri" },
  {
    key: "startupActivity",
    label: "Startup aktiviteleri",
    hint: "dosya yükleme, görev tamamlama",
  },
];

export function preferenceRowsFor(role?: UserRole | null) {
  return role === UserRole.Mentor ? MENTOR_ROWS : MENTEE_ROWS;
}

export function toggledPreferences(
  preferences: NotificationPreferences,
  key: NotificationPreferenceKey,
): NotificationPreferences {
  return { ...preferences, [key]: !preferences[key] };
}

/** "Atlas AI · Takım yetkilisi" for a mentee, "Mentor · UX/UI" for a mentor. */
export function accountChip(session: AppSession) {
  if (session.role !== UserRole.Mentor) {
    return [session.organizationName, session.jobTitle]
      .filter(Boolean)
      .join(" · ");
  }
  // A mentor whose title is just "Mentor" would read "Mentor · Mentor".
  const title = session.jobTitle?.trim();
  return title && title.toLocaleLowerCase("tr-TR") !== "mentor"
    ? `Mentor · ${title}`
    : "Mentor";
}

export function accountAvatarClass(role?: UserRole | null) {
  return role === UserRole.Mentor
    ? "bg-[#eaf6ff] text-[#1583d6]"
    : "bg-[#fff1ec] text-[#e0522a]";
}

export function webEditLinkFor(role?: UserRole | null) {
  return role === UserRole.Mentor
    ? {
        title: "Müsaitlik ve uzmanlık",
        hint: "Takvim müsaitliği ve profil web üzerinden düzenlenir.",
        href: webHref("/mentor-profile"),
      }
    : {
        title: "Profil bilgilerini düzenle",
        hint: "Profil, startup ve dosyalar web üzerinden düzenlenir.",
        href: webHref("/profile"),
      };
}
