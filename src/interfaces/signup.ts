export enum SignupStep {
  PersonalProfile = 1,
  StartupProfile = 2,
  Documents = 3,
  Review = 4,
}

export const SIGNUP_STEP_LABELS: Record<SignupStep, string> = {
  [SignupStep.PersonalProfile]: "Kişisel profilini oluştur",
  [SignupStep.StartupProfile]: "Start up profilini oluştur",
  [SignupStep.Documents]: "Dosyalarını yükle",
  [SignupStep.Review]: "Onay gönder",
};

export const SIGNUP_STEP_ORDER: SignupStep[] = [
  SignupStep.PersonalProfile,
  SignupStep.StartupProfile,
  SignupStep.Documents,
  SignupStep.Review,
];

export const BIO_MAX_LENGTH = 280;
export const TAGLINE_MAX_LENGTH = 80;

export const EXPERTISE_OPTIONS = [
  "UI/UX Design",
  "Branding",
  "User Research",
  "Figma",
  "Prototyping",
  "Illustration",
  "Motion Design",
  "Product Strategy",
  "HTML/CSS",
] as const;

export const SUPPORT_AREA_OPTIONS = [
  "Finans",
  "Pazarlama",
  "Büyüme",
  "UX/UI",
  "Ürün",
  "Satış",
  "Hukuk",
  "Teknoloji",
  "Yatırım",
] as const;

export const PROGRAM_OPTIONS = [
  "Metu Stars- Build",
  "Metu Stars- Launch",
  "Metu Stars- Grow",
] as const;

/**
 * The Figma frame (139:1700) labels BOTH radio rows "MVP". Reproduced here as
 * two distinct levels so the control is usable; the second label needs product
 * confirmation before this ships.
 */
export const PROGRAM_LEVEL_OPTIONS = ["MVP", "Prototip"] as const;

export const CONTACT_PREFERENCE_OPTIONS = [
  "Video görüşme",
  "Mesaj",
  "E-posta",
] as const;

export enum StartupDocumentKind {
  Canvas = "canvas",
  PitchDeck = "pitch-deck",
  Mvp = "mvp",
  Validation = "validation",
}

export interface StartupDocumentSpec {
  kind: StartupDocumentKind;
  title: string;
  description: string;
}

export const STARTUP_DOCUMENTS: StartupDocumentSpec[] = [
  {
    kind: StartupDocumentKind.Canvas,
    title: "Kanvas yükle",
    description:
      "PDF veya DOCX formatındaki dosyanızı kullanarak profilinizi hazırlayın.",
  },
  {
    kind: StartupDocumentKind.PitchDeck,
    title: "Pitch Deck yükle",
    description:
      "PDF veya DOCX formatındaki dosyanızı kullanarak profilinizi hazırlayın.",
  },
  {
    kind: StartupDocumentKind.Mvp,
    title: "MVP/Prototip yükle",
    description:
      "PDF veya DOCX formatındaki dosyanızı kullanarak profilinizi hazırlayın.",
  },
  {
    kind: StartupDocumentKind.Validation,
    title: "Doğrulama Çıktısı yükle",
    description:
      "PDF veya DOCX formatındaki dosyanızı kullanarak profilinizi hazırlayın.",
  },
];

export const DOCUMENT_CHECKLIST: {
  label: string;
  kind: StartupDocumentKind;
}[] = [
  { label: "Pitch Deck", kind: StartupDocumentKind.PitchDeck },
  { label: "MVP / Prototype", kind: StartupDocumentKind.Mvp },
  { label: "Business Model / Lean Canvas", kind: StartupDocumentKind.Canvas },
  { label: "En az 1 doğrulama çıktısı", kind: StartupDocumentKind.Validation },
];

export interface UploadedFile {
  name: string;
  size: number;
}

export interface PersonalProfileDraft {
  firstName: string;
  lastName: string;
  role: string;
  bio: string;
  linkedin: string;
  expertise: string[];
  contactPreferences: string[];
  cv: UploadedFile | null;
}

export interface StartupProfileDraft {
  name: string;
  tagline: string;
  website: string;
  program: string;
  problem: string;
  supportAreas: string[];
  programLevel: string;
  logo: UploadedFile | null;
}

export interface SignupDraft {
  personal: PersonalProfileDraft;
  startup: StartupProfileDraft;
  documents: Partial<Record<StartupDocumentKind, UploadedFile>>;
}
