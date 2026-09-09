import type {
  DashboardNotification,
  LandingAnnouncement,
  LandingFaq,
  LandingMentorStep,
  LandingProgram,
  LandingTraining,
  LandingTrainingCategory,
} from "@/types/landing";
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
  process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL,
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

export const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use":
    "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
  "auth/invalid-email": "E-posta adresi geçersiz.",
  "auth/weak-password": "Şifre çok zayıf. Daha uzun bir şifre seçin.",
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/user-not-found": "E-posta veya şifre hatalı.",
  "auth/wrong-password": "E-posta veya şifre hatalı.",
  "auth/too-many-requests":
    "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
  "auth/network-request-failed": "Bağlantı kurulamadı. Tekrar deneyin.",
  "auth/missing-email": "E-posta adresinizi girin.",
};

export const ACCOUNT_NOT_APPROVED = "ACCOUNT_NOT_APPROVED";
export const REGISTRATION_REQUIRED = "REGISTRATION_REQUIRED";

export const TRANSCRIPT_BOT_LEAD_MS = 60_000;
export const TRANSCRIPT_BOT_MAX_TIMER_MS = 86_400_000;
export const TRANSCRIPT_POLL_MS = 5_000;

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

export const LANDING_ANNOUNCEMENTS: LandingAnnouncement[] = [
  {
    category: "Program",
    date: "27 Temmuz 2026",
    title: "Yeni dönem başvuruları açıldı",
    description:
      "Girişiminiz için uygun programı seçin ve yeni dönem fırsatlarını inceleyin.",
  },
  {
    category: "Eğitim",
    date: "3 Ağustos 2026",
    title: "Ürün geliştirme eğitimi",
    description:
      "Ürün fikrini doğrulama ve ilk ürün sürecine yönelik grup eğitimi.",
  },
  {
    category: "Destek Programı",
    date: "10 Ağustos 2026",
    title: "TÜBİTAK BİGG başvuruları",
    description:
      "Bireysel genç girişimciler için destek programı başvuruları sürüyor.",
  },
];

export const LANDING_MENTOR_STEPS: LandingMentorStep[] = [
  {
    number: "01",
    title: "İhtiyacını belirt",
    text: "Destek almak istediğiniz konuyu ve mevcut probleminizi paylaşın.",
  },
  {
    number: "02",
    title: "Uygun mentorla eşleş",
    text: "Uzmanlık alanınıza ve girişiminizin aşamasına uygun mentorla eşleşin.",
  },
  {
    number: "03",
    title: "Görüşmeni gerçekleştir",
    text: "Görüşme sırasında ihtiyaçlarınızı, riskleri ve olası çözüm yollarını değerlendirin.",
  },
  {
    number: "04",
    title: "Aksiyonlarını takip et",
    text: "Görüşme sonunda belirlenen görevleri ve sonraki adımları platform üzerinden takip edin.",
  },
];

export const LANDING_PROGRAMS: LandingProgram[] = [
  {
    type: "Girişimcilik Programı",
    status: "Başvurular açık",
    title: "METUStars",
    text: "ODTÜ Teknokent girişimleri için yapılandırılmış mentorluk ve gelişim programı.",
    date: "Eylül – Aralık 2026",
  },
  {
    type: "Girişimcilik Programı",
    status: "Yakında",
    title: "YFYİ",
    text: "Yenilikçi fikir ve girişimleri desteklemeye yönelik ulusal program.",
    date: "Ekim 2026",
  },
  {
    type: "Destek Programı",
    status: "Devam ediyor",
    title: "TÜBİTAK BİGG",
    text: "Bireysel genç girişimcileri destekleyen TÜBİTAK destek programı.",
    date: "2026 dönemi",
  },
];

export const LANDING_TRAINING_CATEGORIES = [
  "Tümü",
  "Girişimcilik",
  "İş Modeli",
  "Ürün Geliştirme",
  "Kullanıcı Deneyimi",
  "Pazarlama ve Satış",
  "Finans ve Yatırım",
  "Hukuk ve Şirketleşme",
  "Teknoloji",
] as const satisfies readonly LandingTrainingCategory[];

export const LANDING_TRAININGS: LandingTraining[] = [
  {
    category: "İş Modeli",
    format: "Online",
    title: "İş Modeli Geliştirme",
    trainer: "Eğitmen: İsim 1",
    detail: "5 Ağustos 2026 · 3 saat · Kontenjan 30 kişi",
  },
  {
    category: "Ürün Geliştirme",
    format: "Yüz yüze",
    title: "Ürün Fikrini Doğrulama",
    trainer: "Eğitmen: İsim 2",
    detail: "12 Ağustos 2026 · 4 saat · Kontenjan 20 kişi",
  },
  {
    category: "Hukuk ve Şirketleşme",
    format: "Online",
    title: "Girişimler için Temel Hukuk",
    trainer: "Eğitmen: İsim 1",
    detail: "19 Ağustos 2026 · 2 saat · Açık kayıt",
  },
  {
    category: "Finans ve Yatırım",
    format: "Hibrit",
    title: "Yatırımcı Sunumu Hazırlama",
    trainer: "Eğitmen: İsim 2",
    detail: "26 Ağustos 2026 · 3 saat · Kontenjan 25 kişi",
  },
];

export const LANDING_FAQS: LandingFaq[] = [
  {
    question: "Platforma kimler giriş yapabilir?",
    answer:
      "ODTÜ Teknokent tarafından programa davet edilen kurum yöneticileri, mentorlar, eğitmenler ve girişim ekipleri giriş yapabilir.",
  },
  {
    question: "Mentorumu nasıl bulabilirim?",
    answer:
      "Program yöneticiniz ihtiyacınıza ve girişiminizin aşamasına uygun mentor eşleşmesini çalışma alanınızda paylaşır.",
  },
  {
    question: "Bir programa nasıl katılabilirim?",
    answer:
      "Açık programları inceleyebilir veya size gönderilen davet e-postasındaki bağlantıyı kullanabilirsiniz.",
  },
  {
    question: "Eğitim ve mentorluk arasındaki fark nedir?",
    answer:
      "Mentorluk girişiminizin özel ihtiyacına göre şekillenir; eğitim belirli bir konuda yapılandırılmış içerik sunar.",
  },
  {
    question: "Birden fazla programda yer alabilir miyim?",
    answer:
      "Evet. Size atanmış tüm aktif programlar çalışma alanı seçim ekranında ayrı ayrı gösterilir.",
  },
  {
    question: "Mentorluk görüşmeleri nasıl planlanır?",
    answer:
      "Görüşme zamanı ve bağlantısı, mentorunuz veya program yöneticiniz tarafından platformda paylaşılır.",
  },
  {
    question: "Davet e-postamı bulamıyorum, ne yapmalıyım?",
    answer:
      "Giriş ekranındaki davet e-postası yardım bağlantısını kullanın veya program yöneticinizle iletişime geçin.",
  },
  {
    question: "Platformdaki bilgilerimi kimler görebilir?",
    answer:
      "Bilgileriniz yalnızca rolünüz ve dahil olduğunuz programlar kapsamında yetkilendirilmiş kişilerle paylaşılır.",
  },
];

export const DASHBOARD_NOTIFICATIONS: DashboardNotification[] = [];

export const DASHBOARD_REQUEST_STATUS_LABELS = {
  [MentorshipRequestStatus.Accepted]: "Aktif",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Bilgi bekliyor",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
} satisfies Record<MentorshipRequestStatus, string>;

export const MENTORSHIPS_REQUEST_STATUS_LABELS = {
  [MentorshipRequestStatus.Accepted]: "Aktif mentorluk",
  [MentorshipRequestStatus.Declined]: "Uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek bilgi istendi",
  [MentorshipRequestStatus.Pending]: "Yanıt bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
} satisfies Record<MentorshipRequestStatus, string>;

export const MENTORSHIPS_TABS = [
  [MentorshipWorkspaceTab.MentorPool, "Mentor Havuzu"],
  [MentorshipWorkspaceTab.Active, "Aktif"],
  [MentorshipWorkspaceTab.Requests, "Talepler"],
  [MentorshipWorkspaceTab.History, "Geçmiş"],
] as const;

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

export const CREATE_MEETING_NO_STARTUP_MESSAGE =
  "Toplantı oluşturmak için kabul edilmiş bir mentorluk veya katıldığınız programdaki bir startup gerekir.";

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

export const MEETING_SCHEDULE_DAYS = [
  ["Pzt 12", "09:00", "10:30", "14:00", "15:30"],
  ["Sal 13", "10:00", "11:30"],
  ["Çar 14", "09:00", "14:00", "16:00"],
  ["Per 15", "11:00", "15:00"],
  ["Cum 16", "10:00"],
] as const;

export const MEETING_SCHEDULE_FILTERS = [
  "Bu hafta",
  "Gelecek hafta",
  "Sabah",
  "Öğleden sonra",
] as const;

export const MEETING_PREPARE_CHECKLIST = [
  "Pitch deck'i güncelle",
  "Ürün demosunu ekle",
  "Görüşülecek üç ana soruyu yaz",
  "Önceki aksiyonları tamamla",
  "İlgili verileri yükle",
] as const;

export const MEETING_FEEDBACK_QUESTIONS = [
  "Görüşme ihtiyacınıza ne kadar yardımcı oldu?",
  "Mentorun yaklaşımı ve yönlendirmesi nasıldı?",
  "Bu mentoru başka bir girişimciye önerir misiniz?",
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
    links: ["Mentorluk Nedir?", "Programlar", "Eğitimler", "Duyurular"],
  },
  {
    title: "Destek",
    links: ["Yardım Merkezi", "Sıkça Sorulan Sorular", "İletişim"],
  },
  {
    title: "Yasal",
    links: ["Gizlilik", "Kullanım Koşulları", "KVKK"],
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
    label: "Planlandı",
    color: "var(--ma-blue)",
    bg: "var(--ma-bluebg)",
  },
  [MeetingStatus.Joining]: {
    label: "Katılıyor",
    color: "var(--ma-accent)",
    bg: "var(--ma-accentbg)",
  },
  [MeetingStatus.Active]: {
    label: "Canlı",
    color: "var(--ma-green)",
    bg: "var(--ma-greenbg)",
  },
  [MeetingStatus.Completed]: {
    label: "Bitti",
    color: "var(--ma-green)",
    bg: "var(--ma-greenbg)",
  },
  [MeetingStatus.Failed]: {
    label: "Hata",
    color: "var(--ma-danger)",
    bg: "var(--ma-dangerbg)",
  },
};
