import { UserRole } from "@/interfaces/session";

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

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: "Yönetici",
  [UserRole.Coordinator]: "Koordinatör",
  [UserRole.Mentee]: "Mentee",
  [UserRole.Mentor]: "Mentor",
};

export const PROGRAM_DETAIL_QUERY_KEY = "program-detail" as const;
