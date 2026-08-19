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
import type { Meeting, MeetingStatusMeta } from "@/types/assistant";
import { MeetingPlatform, MeetingStatus } from "@/types/assistant";
import type { MentorRequestMentor } from "@/types/mentor-request";
import { MentorRequestStep } from "@/types/mentor-request";
import { MentorshipDetailTab } from "@/types/mentorship";

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

export function getBackendHealthUrl(): string {
  return `${BACKEND_URL}${BACKEND_HEALTH_PATH}`;
}

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

export const DASHBOARD_NOTIFICATIONS: DashboardNotification[] = [
  {
    title: "Dr. Kemal Arslan toplantı notu ekledi",
    time: "2s önce · Mentordan",
  },
  {
    title: "Program: Demo Day başvuruları açıldı",
    time: "1g önce · Program",
  },
  {
    title: "Can Demir talebinizi kabul etti",
    time: "2g önce · Mentordan",
  },
];

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

export const MENTOR_REQUEST_STEPS = [
  "İhtiyaç",
  "Beklenti",
  "Bilgiler",
  "Mentor Seçimi",
  "Talep",
] as const;

export const MENTOR_REQUEST_TITLES: Record<
  MentorRequestStep,
  [string, string]
> = {
  [MentorRequestStep.Need]: [
    "Hangi konuda desteğe ihtiyacınız var?",
    "İhtiyacınızı doğru tanımlamanız, size daha uygun mentorların önerilmesini sağlar.",
  ],
  [MentorRequestStep.Expectation]: [
    "Nasıl bir destek arıyorsunuz?",
    "Mentorluk biçimi ve iletişim tercihlerinizi belirleyin.",
  ],
  [MentorRequestStep.Info]: [
    "Mentorla paylaşılacak bilgileri kontrol edin",
    "Aşağıdaki bilgiler startup profilinizden otomatik olarak alınmıştır.",
  ],
  [MentorRequestStep.MentorSelect]: [
    "İhtiyacınıza uygun mentorlar",
    "Alan: Ürün & ürün yönetimi · Kullanıcı testi",
  ],
  [MentorRequestStep.Review]: [
    "Mentorluk talebinizi gözden geçirin",
    "Göndermeden önce seçimlerinizi kontrol edin.",
  ],
};

export const MENTOR_REQUEST_SUPPORT_AREAS = [
  "Ürün ve ürün yönetimi",
  "Kullanıcı araştırması ve tasarım",
  "Yazılım ve teknoloji",
  "Satış ve pazarlama",
  "İş modeli ve strateji",
  "Finans ve yatırım",
  "Hukuk ve fikrî mülkiyet",
  "Ekip ve organizasyon",
  "Destek programları ve teşvikler",
  "Diğer",
] as const;

export const MENTOR_REQUEST_URGENCY_OPTIONS = [
  "Bu hafta",
  "Önümüzdeki iki hafta",
  "Bu ay",
  "Acil değil",
] as const;

export const MENTORSHIP_DETAIL_TABS: {
  id: MentorshipDetailTab;
  label: string;
}[] = [
  { id: MentorshipDetailTab.Overview, label: "Genel Bakış" },
  { id: MentorshipDetailTab.Meetings, label: "Toplantılar" },
  { id: MentorshipDetailTab.Actions, label: "Aksiyonlar" },
  { id: MentorshipDetailTab.Files, label: "Dosyalar" },
];

export const MENTOR_REQUEST_MENTORS: MentorRequestMentor[] = [
  {
    initials: "DK",
    name: "Dr. Kemal Arslan",
    role: "Ürün & Araştırma Direktörü · Trendyol",
    availability: "Bu hafta müsait",
    tags: ["Kullanıcı araştırması", "MVP testi", "UX stratejisi"],
    meta: ["Online", "Mesajlaşma açık", "Yapılandırılmış & Uygulamalı"],
    reasons: [
      "MVP seviyesindeki girişimlerle çalışıyor",
      "Kullanıcı testi süreçlerinde deneyimli",
      "Bu hafta müsait",
    ],
  },
  {
    initials: "SÖ",
    name: "Selin Öztürk",
    role: "Kurucu · HealthTech Ventures",
    availability: "Bu hafta müsait",
    tags: ["B2B SaaS", "Sağlık teknolojileri", "Ürün-pazar uyumu"],
    meta: ["Online / Yüz yüze", "Mesajlaşma açık", "Esnek & Birlikte keşfeden"],
    reasons: [
      "Sağlık teknolojileri deneyimi bulunuyor",
      "B2B SaaS konusunda uzmanlaşmış",
      "Kullanıcı doğrulama süreçlerinde aktif",
    ],
  },
  {
    initials: "MÇ",
    name: "Murat Çelik",
    role: "Ürün Müdürü · Peak Games",
    availability: "Gelecek hafta müsait",
    tags: ["Ürün analitik", "Kullanıcı segmentasyonu", "Test metodolojisi"],
    meta: ["Online", "Yalnızca toplantı", "Yönlendirici & Stratejik"],
    reasons: [
      "Test metodolojisi konusunda uzmanlaşmış",
      "Büyük kullanıcı kitleleriyle çalışma deneyimi",
    ],
  },
];

export const MENTOR_REQUEST_TEAM_MEMBERS = [
  ["AK", "Ayşe Kaya", "CEO"],
  ["BŞ", "Burak Şahin", "CTO"],
  ["ED", "Ece Doğan", "Tasarım"],
] as const;

export const MENTOR_COMPARE_COLUMNS = [
  ["DK", "Dr. Kemal Arslan", "En uygun"],
  ["SÖ", "Selin Öztürk", ""],
  ["MÇ", "Murat Çelik", ""],
] as const;

export const MENTOR_REQUEST_STATUS_OPTIONS = [
  ["waiting", "Yanıt Bekleniyor"],
  ["question", "Ek Bilgi İstendi"],
  ["accepted", "Kabul Edildi"],
  ["declined", "Uygun Değil"],
] as const;

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

export const WORKSPACES = [
  {
    id: "metustars",
    title: "METUStars 2026",
    role: "Mentor",
    status: "Aktif",
  },
  {
    id: "dps-egitim",
    title: "DPS Girişimcilik Eğitimi",
    role: "Eğitmen",
    status: "Aktif",
  },
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

export const MENTOR_COMPARISON_ROWS = [
  ["İhtiyaç uyumu", "Çok yüksek", "Yüksek", "Orta"],
  [
    "İlgili uzmanlık",
    "Kullanıcı testi, UX",
    "B2B SaaS, Sağlık",
    "Analitik, Segmentasyon",
  ],
  ["Startup seviyesi", "Seed & MVP", "MVP & Büyüme", "Pre-seed & Seed"],
  ["Sektör deneyimi", "E-ticaret, SaaS", "HealthTech, SaaS", "Oyun, Tüketici"],
  ["Mentorluk tarzı", "Yapılandırılmış", "Esnek", "Yönlendirici"],
  ["Görüşme biçimi", "Online", "Online / YY", "Online"],
  ["Mesajlaşma", "✓ Açık", "✓ Açık", "× Kapalı"],
  ["Müsaitlik", "Bu hafta", "Bu hafta", "Gelecek hafta"],
  ["Yanıt süresi", "~24 saat", "~48 saat", "~24 saat"],
];

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

export const ASSISTANT_INITIAL_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Mentorluk — Ürün roadmap",
    platform: MeetingPlatform.GoogleMeet,
    platformKey: "google_meet",
    nativeMeetingId: "",
    status: MeetingStatus.Active,
    when: "Şimdi",
    participants: ["Ayşe Kaya", "Dr. Kemal Arslan"],
  },
  {
    id: "m2",
    title: "Sprint review",
    platform: MeetingPlatform.Zoom,
    platformKey: "google_meet",
    nativeMeetingId: "",
    status: MeetingStatus.Scheduled,
    when: "Bugün 15:00",
    participants: ["Ayşe Kaya", "Takım"],
  },
  {
    id: "m3",
    title: "Yatırımcı hazırlık",
    platform: MeetingPlatform.Teams,
    platformKey: "google_meet",
    nativeMeetingId: "",
    status: MeetingStatus.Completed,
    when: "Dün",
    participants: ["Ayşe Kaya", "Mentor"],
  },
];

export const ASSISTANT_SAMPLE_NOTES: Record<string, string[]> = {
  m1: [
    "Kullanıcı testi cohort: 8 kişi",
    "Odak metrikler: activation, time-to-value",
    "Aksiyon: haftaya aksiyon listesi paylaşılacak",
  ],
  m2: ["Toplantı henüz başlamadı."],
  m3: ["Traction slaytı güncellenecek", "MRR + churn grafikleri eklenecek"],
};

export const ASSISTANT_SAMPLE_PAD: Record<string, string> = {
  m1: "• Cohort hedefi: 8 kişi\n• Activation + TTV metrikleri\n• Haftaya aksiyon listesi paylaş",
  m2: "",
  m3: "• Traction slaytı güçlendirilecek\n• MRR + churn grafikleri",
};
