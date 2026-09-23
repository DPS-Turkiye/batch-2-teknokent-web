import { ProfileChipTone } from "@/lib/personal-profile";

export const PROFILE_CHIP_CLASSES: Record<ProfileChipTone, string> = {
  [ProfileChipTone.Program]: "border-[#f6c9a5] bg-[#fff4ec] text-[#9e4400]",
  [ProfileChipTone.Active]: "border-[#cbebda] bg-[#eefaf3] text-[#0f7a4d]",
  [ProfileChipTone.Neutral]: "border-[#e4e7ea] bg-[#f3f4f6] text-[#4a5059]",
};

export const PROFILE_BUTTON_TEXT_CLASS =
  "text-[12.5px]! font-medium! leading-[19px]!";
export const PROFILE_LINK_CLASS = `text-[#9e4400] ${PROFILE_BUTTON_TEXT_CLASS}`;
export const PROFILE_INPUT_CLASS =
  "mt-1 block w-full rounded-lg border border-[#d4d8dd] px-3 py-2 text-[13px]! text-[#22262b]";
export const PROFILE_EMPTY_CLASS = "text-[12.5px] text-[#858c96]";
export const PROFILE_ROW_CLASS =
  "flex items-center justify-between gap-4 text-[12.5px] leading-[19px]";

export const PERSON_PROFILE_VIEW_LABELS = {
  about: "Hakkımda",
  noBio: "Henüz hakkında bilgisi eklenmedi.",
  expertise: "Uzmanlık alanları",
  startup: "Startup",
  startupLink: "Startup profiline git →",
  contact: "İletişim",
  email: "E-posta",
  role: "Rol",
  linkedin: "LinkedIn",
  linkedinOpen: "Profili aç →",
  dash: "—",
} as const;
