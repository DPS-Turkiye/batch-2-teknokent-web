import type { LoginRoleGroup } from "@/interfaces/login";
import { LoginRoleId } from "@/interfaces/login";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorRequestFilter,
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import type { MeetingStatusMeta } from "@/types/assistant";
import { MeetingStatus } from "@/types/assistant";
import { MentorshipWorkspaceTab } from "@/types/mentorship";

export const DEFAULT_APP_URL = "http://localhost:3000";
export const DEFAULT_BACKEND_URL = "http://localhost:8080";
export const BACKEND_HEALTH_PATH = "/api/health";
export const HEALTH_API_PATH = "/api/health";

export * from "./programs";
export * from "./mentorships";
export * from "./mentee-home";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export const APP_URL = normalizeUrl(process.env.APP_URL ?? DEFAULT_APP_URL);
export const BACKEND_URL = normalizeUrl(
  process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL,
);

export function getBackendUrl(): string {
  return BACKEND_URL;
}

/**
 * The Amplify-hosted frontend's own edge blocks any request body over ~8KB on
 * its proxy routes, so document uploads go straight from the browser to the
 * backend instead. That needs a NEXT_PUBLIC_ variable, since BACKEND_URL is
 * never inlined into the client bundle — amplify.yml derives this one from
 * BACKEND_URL at build time so the two cannot drift apart.
 */
export const PUBLIC_BACKEND_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL,
);

export function getPublicBackendUrl(): string {
  return PUBLIC_BACKEND_URL;
}

export function getBackendHealthUrl(): string {
  return `${BACKEND_URL}${BACKEND_HEALTH_PATH}`;
}

export const EMAIL_VERIFICATION_EXEMPT = [
  "admin@teknokent.demo",
  "coordinator@teknokent.demo",
] as const;

export const ACCOUNT_NOT_APPROVED = "ACCOUNT_NOT_APPROVED";
export const REGISTRATION_REQUIRED = "REGISTRATION_REQUIRED";

export const TRANSCRIPT_BOT_LEAD_MS = 60_000;
export const TRANSCRIPT_BOT_MAX_TIMER_MS = 86_400_000;
export const TRANSCRIPT_POLL_MS = 5_000;
export const CALENDAR_MEETING_DURATION_MINUTES = 60;
export const MENTORSHIP_MEETING_DURATION_MINUTES = 45;

export const BOT_API_PATH = "/api/botapi";
export const TRANSCRIPT_API_PATH = "/api/transcriptapi";

export function getBotApiUrl(): string {
  return BOT_API_PATH;
}

export function getStopBotApiUrl(
  platform: string,
  nativeMeetingId: string,
): string {
  const q = new URLSearchParams({ platform, nativeMeetingId });
  return `${BOT_API_PATH}?${q.toString()}`;
}

export function getTranscriptApiUrl(
  platform: string,
  nativeMeetingId: string,
): string {
  const q = new URLSearchParams({ platform, nativeMeetingId });
  return `${TRANSCRIPT_API_PATH}?${q.toString()}`;
}

export const MEETING_REPORT_API_PATH = "/api/botapi/report";

export function getMeetingReportApiUrl(
  platform: string,
  nativeMeetingId: string,
): string {
  const q = new URLSearchParams({ platform, nativeMeetingId });
  return `${MEETING_REPORT_API_PATH}?${q.toString()}`;
}

export const DEFAULT_REALTIME_URL = "ws://localhost:8080/ws";
export const REALTIME_TOKEN_API_PATH = "/api/realtime/token";

export function getRealtimeUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? DEFAULT_REALTIME_URL;
}

export function getMeetingNoteApiUrl(meetingId: string): string {
  return `/api/meetings/${encodeURIComponent(meetingId)}/note`;
}

export function getMeetingNoteDocumentApiUrl(meetingId: string): string {
  return `${getMeetingNoteApiUrl(meetingId)}/document`;
}

export function getMeetingTodosApiUrl(meetingId: string): string {
  return `/api/meetings/${encodeURIComponent(meetingId)}/todos`;
}

export function getMeetingTodoApiUrl(
  meetingId: string,
  todoId: string,
): string {
  return `${getMeetingTodosApiUrl(meetingId)}/${encodeURIComponent(todoId)}`;
}

export function getAssistantShareApiUrl(meetingId: string): string {
  return `/api/meetings/${encodeURIComponent(meetingId)}/assistant-share`;
}

export function getAssistantShareTranscriptUploadApiUrl(
  meetingId: string,
): string {
  return `${getAssistantShareApiUrl(meetingId)}/transcript-upload`;
}

export function getAssistantShareReportUploadApiUrl(meetingId: string): string {
  return `${getAssistantShareApiUrl(meetingId)}/report-upload`;
}

export function getMeetingRoomTopic(meetingId: string): string {
  return `/topic/meetings/${meetingId}`;
}

export function getMeetingDocumentDestination(meetingId: string): string {
  return `/app/meetings/${meetingId}/document`;
}

export function getMeetingPresenceDestination(meetingId: string): string {
  return `/app/meetings/${meetingId}/presence`;
}

export const DASHBOARD_REQUEST_STATUS_LABELS = {
  [MentorshipRequestStatus.Accepted]: "Aktif",
  [MentorshipRequestStatus.CounterProposed]: "Saat önerisi",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Bilgi bekliyor",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
} satisfies Record<MentorshipRequestStatus, string>;

export const MENTORSHIPS_REQUEST_STATUS_LABELS = {
  [MentorshipRequestStatus.Accepted]: "Aktif mentorluk",
  [MentorshipRequestStatus.CounterProposed]: "Mentör saat önerdi",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek bilgi istendi",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
} satisfies Record<MentorshipRequestStatus, string>;

export const MENTORSHIPS_TABS = [
  MentorshipWorkspaceTab.MentorPool,
  MentorshipWorkspaceTab.Active,
  MentorshipWorkspaceTab.Requests,
  MentorshipWorkspaceTab.Regular,
  MentorshipWorkspaceTab.History,
] as const;

export const MENTOR_MENTORSHIPS_TABS = [
  MentorshipWorkspaceTab.Requests,
  MentorshipWorkspaceTab.Active,
  MentorshipWorkspaceTab.Regular,
  MentorshipWorkspaceTab.History,
] as const;

export const MENTORSHIP_LIST_PAGE_SIZE = 7;

export const CALENDAR_SUPPORT_AREA = "Takvim toplantısı";

export const MENTOR_DASHBOARD_FILTER_STATUSES: Record<
  Exclude<MentorRequestFilter, MentorRequestFilter.All>,
  MentorshipRequestStatus
> = {
  [MentorRequestFilter.Accepted]: MentorshipRequestStatus.Accepted,
  [MentorRequestFilter.Declined]: MentorshipRequestStatus.Declined,
  [MentorRequestFilter.MoreInfoRequested]:
    MentorshipRequestStatus.MoreInfoRequested,
  [MentorRequestFilter.Pending]: MentorshipRequestStatus.Pending,
};

export const MENTOR_DASHBOARD_FILTER_OPTIONS = [
  [MentorRequestFilter.All, "Tüm Talepler"],
  [MentorRequestFilter.Pending, "Bekleyenler"],
  [MentorRequestFilter.MoreInfoRequested, "Ek Bilgi İstenenler"],
  [MentorRequestFilter.Accepted, "Kabul Edilenler"],
  [MentorRequestFilter.Declined, "Uygun Değil"],
] as const;

export const DASHBOARD_FALLBACK_MEETINGS: MeetingItem[] = [];

export const DASHBOARD_FALLBACK_REQUESTS: MentorshipRequest[] = [];

export const LOGIN_ROLE_GROUPS: LoginRoleGroup[] = [
  {
    id: "management",
    title: "Kurum Yönetimi",
    description:
      "Programları, kullanıcıları ve kurum operasyonlarını yöneten kullanıcılar.",
    roles: [
      {
        id: LoginRoleId.Admin,
        label: "Admin",
        description:
          "Kurum ayarlarını, kullanıcıları ve sistem yetkilerini yönetin.",
      },
      {
        id: LoginRoleId.ProgramManager,
        label: "Program Yöneticisi",
        description:
          "Programları, katılımcıları ve süreç operasyonlarını takip edin.",
      },
    ],
  },
  {
    id: "mentorship",
    title: "Mentorluk ve Eğitim",
    description:
      "Girişimlere mentorluk veya eğitim desteği sağlayan kullanıcılar.",
    roles: [
      {
        id: LoginRoleId.Mentor,
        label: "Mentor",
        description:
          "Atandığınız girişimlerle görüşmeler gerçekleştirin, öneri ve aksiyonlar oluşturun.",
      },
      {
        id: LoginRoleId.Trainer,
        label: "Eğitmen",
        description:
          "Eğitimleri, katılımcıları, materyalleri ve ödevleri yönetin.",
      },
    ],
  },
  {
    id: "startup",
    title: "Girişim Ekibi",
    description:
      "Startup süreçlerini, görevlerini ve ilerlemelerini yöneten ekip üyeleri.",
    roles: [
      {
        id: LoginRoleId.StartupOwner,
        label: "Startup Yetkilisi",
        description:
          "Startup profilini, ekip üyelerini, destek taleplerini ve program süreçlerini yönetin.",
      },
      {
        id: LoginRoleId.Mentee,
        label: "Mentee / Ekip Üyesi",
        description:
          "Görevlerinizi, görüşmelerinizi, kayıtlarınızı ve startup ilerlemenizi takip edin.",
      },
    ],
  },
];

export const MEETING_FEEDBACK_QUESTIONS = [
  {
    id: "nextSteps",
    prompt: "Görüşme sonunda bir sonraki adımlarım ne kadar netleşti?",
    low: "1 — Hiç netleşmedi",
    high: "5 — Tamamen netleşti",
  },
  {
    id: "fit",
    prompt: "Öneriler girişimimin mevcut aşamasına ne kadar uygundu?",
    low: "1 — Hiç uygun değildi",
    high: "5 — Tamamen uygundu",
  },
  {
    id: "expression",
    prompt: "Fikirlerimi, sorularımı ve çekincelerimi rahatça ifade edebildim.",
    low: "1 — Hiç katılmıyorum",
    high: "5 — Tamamen katılıyorum",
  },
  {
    id: "confidence",
    prompt:
      "Bu konuda ilerleyebileceğime dair güvenim görüşme sonrasında nasıl değişti?",
    low: "1 — Azaldı",
    high: "5 — Belirgin şekilde arttı",
  },
] as const;

export const MEETING_FEEDBACK_BENEFITS = [
  "Önceliklerimi netleştirmek",
  "Finansal modeli anlamak",
  "Varsayımlarımı sorgulamak",
  "Somut aksiyonlar belirlemek",
  "Yeni bir bakış açısı kazanmak",
  "Kaynak / bağlantı önerileri",
] as const;

/** The `meetingPages.feedback.benefits` key of each benefit above, in the same order; the Turkish text is what gets saved. */
export const MEETING_FEEDBACK_BENEFIT_IDS = [
  "priorities",
  "finance",
  "assumptions",
  "actions",
  "perspective",
  "resources",
] as const;

export const SITE_NAV_ITEMS = [
  { href: "#duyurular", label: "Duyurular" },
  { href: "#mentorluk", label: "Mentorluk Nedir?" },
  { href: "#programlar", label: "Programlar" },
  { href: "#egitimler", label: "Eğitimler" },
  { href: "#sss", label: "Sıkça Sorulan Sorular" },
  { href: "#yardim", label: "Yardım" },
] as const;

export const SITE_FOOTER_GROUPS = [
  {
    title: "Platform",
    links: [
      { href: "/#mentorluk", label: "Mentorluk Nedir?" },
      { href: "/#programlar", label: "Programlar" },
      { href: "/#egitimler", label: "Eğitimler" },
      { href: "/#duyurular", label: "Duyurular" },
    ],
  },
  {
    title: "Destek",
    links: [
      {
        href: "mailto:info@metu.edu.tr?subject=METUal%20Destek",
        label: "Yardım Merkezi",
      },
      { href: "/#sss", label: "Sıkça Sorulan Sorular" },
      { href: "mailto:info@metu.edu.tr", label: "İletişim" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: null, label: "Gizlilik" },
      { href: null, label: "Kullanım Koşulları" },
      { href: null, label: "KVKK" },
    ],
  },
] as const;

export const ACCEPTED_CALENDAR_DAYS = [
  ["Pzt 12", "09:00", "10:30", "14:00", "15:30"],
  ["Sal 13", "10:00", "11:30"],
  ["Çar 14", "09:00", "14:00", "16:00"],
  ["Per 15", "11:00", "15:00"],
  ["Cum 16", "10:00"],
] as const;

export const MEETING_STATUS_META: Record<MeetingStatus, MeetingStatusMeta> = {
  [MeetingStatus.Scheduled]: {
    color: "var(--ma-blue)",
    bg: "var(--ma-bluebg)",
  },
  [MeetingStatus.Joining]: {
    color: "var(--ma-accent)",
    bg: "var(--ma-accentbg)",
  },
  [MeetingStatus.Active]: {
    color: "var(--ma-green)",
    bg: "var(--ma-greenbg)",
  },
  [MeetingStatus.Completed]: {
    color: "var(--ma-green)",
    bg: "var(--ma-greenbg)",
  },
  [MeetingStatus.Failed]: {
    color: "var(--ma-danger)",
    bg: "var(--ma-dangerbg)",
  },
};

export const DOCUMENT_UPLOAD_ACCEPT = ".pdf,.docx,.xlsx,.pptx";
/** Mirrors the backend's DocumentKind limit for documents (images stay at 5 MB). */
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;

// No team mailbox yet; swap this when one exists.
export const SUPPORT_EMAIL = "arya.zaeri@gmail.com";
