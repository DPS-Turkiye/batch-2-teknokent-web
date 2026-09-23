import { UserRole } from "@/interfaces/session";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

export const PROGRAM_CARD_CLASS =
  "rounded-[20px] border border-[#e4e7ea] bg-white px-5 py-4";

export const STARTUP_INFO_CARD_CLASS =
  "space-y-3 rounded-[24px] border border-[#e4e7ea] bg-white px-[22px] py-5";

export const STARTUP_INFO_CARD_TITLE_CLASS =
  "text-[15px] font-semibold leading-[23px] text-[#22262b]";

export const STARTUP_INFO_CARD_HINT_CLASS =
  "text-[12.5px] leading-[19px] text-[#676e78]";

export const STARTUP_INFO_BODY_CLASS = "text-[13px] leading-5 text-[#4a5059]";

export const PROGRAM_DETAIL_LABELS = {
  home: "Anasayfa",
  programs: "Programlarım",
  loading: "Program yükleniyor…",
  notFound: "Program bulunamadı.",
  programEyebrow: "Program",
  coordinator: "Koordinatör",
  mentors: "Mentorlar",
  noMentors: "Henüz kabul edilmiş mentor yok.",
  mentorRole: "Mentor",
  startups: "Startuplar",
  noStartups: "Programda henüz startup yok.",
  noMembers: "Ekip üyesi yok.",
  memberCount: (count: number) => `${count} kişi`,
  memberFallback: "Üye",
  founder: "Kurucu",
} as const;

export const ORGANIZATION_STARTUP_LABELS = {
  home: "Anasayfa",
  loading: "Startup bilgileri yükleniyor…",
  notFound: "Startup bulunamadı.",
  mentorOnly: "Startup bilgi sayfası yalnızca mentorlar için açıktır.",
  about: "Startup hakkında",
  noDescription: "Henüz bir tanıtım yazısı eklenmedi.",
  canvas: "Business Model Canvas",
  view: "Görüntüle",
  noCanvas: "Canvas dosyası henüz eklenmemiş.",
  files: "Dosyalar",
  team: "Ekip üyeleri",
  noTeam: "Ekip üyesi bulunamadı.",
  stage: "Aşama",
  sector: "Sektör",
  program: "Program",
  profileFallback: "Startup profili",
  dash: "—",
  memberFallback: "Üye",
  founder: "Kurucu",
} as const;

export const MENTOR_REQUEST_STARTUP_LABELS = {
  loading: "Startup bilgileri yükleniyor…",
  notFound: "Mentorluk talebi bulunamadı.",
  mentorships: "Mentorluklarım",
  requests: "Talepler",
  startupFallback: "Startup",
  decline: "Reddet",
  message: "Mesaj gönder",
  accept: "Mentorluğu kabul et",
  stage: "Aşama",
  sector: "Sektör",
  program: "Program",
  requestDate: "Talep tarihi",
  about: "Startup hakkında",
  noDescription: "Henüz bir tanıtım yazısı eklenmedi.",
  canvas: "Business Model Canvas",
  canvasHint: "İş modelini tek sayfada özetleyen çalışma dosyası.",
  view: "Görüntüle",
  noCanvas: "Canvas dosyası henüz eklenmemiş.",
  focus: "Talep edilen odak alanı",
  noFocus: "Odak alanı belirtilmemiş.",
  need: "Mentorluk ihtiyacı",
  noNeed: "İhtiyaç metni eklenmemiş.",
  files: "Eklenen dosyalar",
  noFiles: "Henüz dosya eklenmemiş.",
  team: "Ekip üyeleri",
  noTeam: "Ekip üyesi bulunamadı.",
  manager: "Yönetici",
  member: "Üye",
  founder: "Kurucu",
  dash: "—",
  acceptDefaultMessage: "Talebiniz kabul edildi.",
  acceptError: "Talep kabul edilemedi. Lütfen tekrar dene.",
  proposeError: "Öneri gönderilemedi. Lütfen tekrar dene.",
  declineMessage: "Şu an uygun değilim.",
  declineError: "Talep reddedilemedi. Lütfen tekrar dene.",
} as const;

export const MENTORSHIP_REQUEST_STATUS_CHIPS: Record<
  MentorshipRequestStatus,
  string
> = {
  [MentorshipRequestStatus.Pending]: "Yeni talep",
  [MentorshipRequestStatus.CounterProposed]: "Saat önerildi",
  [MentorshipRequestStatus.Accepted]: "Kabul edildi",
  [MentorshipRequestStatus.Declined]: "Reddedildi",
  [MentorshipRequestStatus.MoreInfoRequested]: "Ek bilgi istendi",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
};

export const PERSON_PROFILE_LABELS = {
  home: "Anasayfa",
  profile: "Profil",
  loading: "Profil yükleniyor…",
  notFound: "Kullanıcı bulunamadı.",
  redirecting: "Mentor profiline yönlendiriliyorsun…",
  redirectingOwn: "Profiline yönlendiriliyorsun…",
  noBio: "Henüz bir biyografi eklenmemiş.",
  linkedin: "LinkedIn profili",
} as const;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Yönetici",
  [UserRole.Coordinator]: "Koordinatör",
  [UserRole.Mentee]: "Mentee",
  [UserRole.Mentor]: "Mentor",
};

export const PROGRAM_DETAIL_QUERY_KEY = "program-detail" as const;
