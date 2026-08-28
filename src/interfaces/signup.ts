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

// Second level pending product confirmation.
export const PROGRAM_LEVEL_OPTIONS = ["MVP", "Prototip"] as const;

export const CONTACT_PREFERENCE_OPTIONS = [
  "Video görüşme",
  "Mesaj",
  "Yüz yüze",
  "E-posta",
] as const;

// Inferred option lists, pending product confirmation.
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

export const TEAM_SIZE_OPTIONS = ["1", "2", "3", "4", "5+"] as const;

export const PRODUCT_STATUS_OPTIONS = [
  "Fikir / araştırma",
  "Prototip / wireframe",
  "Çalışan MVP",
  "Yayında",
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
  solution: string;
  currentSolution: string;
  targetUser: string;
  sector: string;
  maturity: string;
  teamSize: string;
  productStatus: string;
  userEvidence: string;
  supportAreas: string[];
  programLevel: string;
  logo: UploadedFile | null;
}

export interface SignupDraft {
  personal: PersonalProfileDraft;
  startup: StartupProfileDraft;
  documents: Partial<Record<StartupDocumentKind, UploadedFile>>;
}
