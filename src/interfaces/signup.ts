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

export const SIGNUP_STEP_CTA: Record<SignupStep, string> = {
  [SignupStep.PersonalProfile]: "Startup'ımı oluştur",
  [SignupStep.StartupProfile]: "Dosyalarını Ekle →",
  [SignupStep.Documents]: "Gözden geçir ve gönder →",
  [SignupStep.Review]: "Koordinatör onayına gönder →",
};

export const SIGNUP_STEP_ORDER: SignupStep[] = [
  SignupStep.PersonalProfile,
  SignupStep.StartupProfile,
  SignupStep.Documents,
  SignupStep.Review,
];

export const BIO_MAX_LENGTH = 280;
export const TAGLINE_MAX_LENGTH = 80;

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

export const PROGRAM_LEVEL_OPTIONS = ["MVP", "Prototip"] as const;

export const CONTACT_PREFERENCE_OPTIONS = [
  "Video görüşme",
  "Mesaj",
  "Yüz yüze",
  "E-posta",
] as const;

export const SECTOR_OPTIONS = [
  "SaaS",
  "E-ticaret",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Oyun",
  "Donanım",
  "Yapay Zekâ",
  "Diğer",
] as const;

export const MATURITY_OPTIONS = [
  "Fikir aşaması",
  "MVP geliştiriliyor",
  "MVP yayında",
  "Gelir elde ediyor",
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
  file?: File;
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
  /** Chosen at signup; null is a real answer meaning no program. */
  programId: string | null;
  problem: string;
  solution: string;
  currentSolution: string;
  targetUser: string;
  sector: string;
  maturity: string;
  supportAreas: string[];
  programLevel: string;
  logo: UploadedFile | null;
}

export interface SignupDraft {
  personal: PersonalProfileDraft;
  startup: StartupProfileDraft;
  documents: Partial<Record<StartupDocumentKind, UploadedFile>>;
}
