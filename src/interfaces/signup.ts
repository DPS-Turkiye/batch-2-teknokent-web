import { DocumentKind } from "@/interfaces/startup-document";

/** The `?role=` value on /signup; the role page sets it. */
export enum SignupRole {
  Founder = "founder",
  Mentor = "mentor",
}

export enum SignupStep {
  PersonalProfile = 1,
  StartupProfile = 2,
  Documents = 3,
  Review = 4,
}

export const SIGNUP_STEPS: { step: SignupStep; title: string; hint: string }[] =
  [
    {
      step: SignupStep.PersonalProfile,
      title: "Kişisel profilin",
      hint: "Mentorlar seni bu bilgilerle tanır",
    },
    {
      step: SignupStep.StartupProfile,
      title: "Startup profilin",
      hint: "Koordinatör ve mentorlar görür",
    },
    {
      step: SignupStep.Documents,
      title: "Dosyalar",
      hint: "Kanvas, pitch deck, prototip",
    },
    {
      step: SignupStep.Review,
      title: "Gözden geçir ve gönder",
      hint: "Koordinatör onayına gider",
    },
  ];

export const SIGNUP_STEP_ORDER: SignupStep[] = SIGNUP_STEPS.map(
  (item) => item.step,
);

export const BIO_MAX_LENGTH = 280;
export const TAGLINE_MAX_LENGTH = 80;
export const MAX_SUPPORT_AREAS = 3;

/** Mirrors the backend enum; the labels are what the chips show. */
export enum ContactPreference {
  InAppMessage = "IN_APP_MESSAGE",
  VideoCall = "VIDEO_CALL",
  Email = "EMAIL",
  InPerson = "IN_PERSON",
}

/** Startup stage values, shared by the mentee's own stage and the mentor's preferences. */
export const STARTUP_STAGE_OPTIONS = [
  "Fikir",
  "Prototip",
  "MVP",
  "Gelir",
  "Büyüme",
] as const;

export const SUPPORT_AREA_OPTIONS = [
  "Ürün & UX",
  "Value Proposition",
  "User Research",
  "Finans",
  "Pazarlama",
  "Büyüme",
  "Satış",
  "Hukuk",
  "Teknoloji",
  "Yatırım",
] as const;

/** The four documents the signup wizard asks a startup for. */
export enum StartupDocumentKind {
  Canvas = DocumentKind.Canvas,
  PitchDeck = DocumentKind.PitchDeck,
  Mvp = DocumentKind.Mvp,
  Validation = DocumentKind.Validation,
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
  contactPreferences: ContactPreference[];
  cv: UploadedFile | null;
}

/** A teammate listed during signup; they join later with the invite code. */
export interface TeamMemberDraft {
  fullName: string;
  jobTitle: string;
  email: string;
}

export interface StartupProfileDraft {
  name: string;
  tagline: string;
  website: string;
  foundedYear: string;
  /** Required at signup; null until one is picked. */
  programId: string | null;
  /** "Startup'ı daha sonra oluşturacağım": sign up into the program without a startup. */
  startupLater?: boolean;
  maturity: string;
  teamMembers: TeamMemberDraft[];
  supportAreas: string[];
  logo: UploadedFile | null;
}

/** The three files the revised signup asks for. */
export const SIGNUP_DOCUMENT_KINDS = [
  StartupDocumentKind.Canvas,
  StartupDocumentKind.PitchDeck,
  StartupDocumentKind.Mvp,
] as const;

export interface SignupDraft {
  personal: PersonalProfileDraft;
  startup: StartupProfileDraft;
  documents: Partial<Record<StartupDocumentKind, UploadedFile>>;
  mvpUrl: string;
  consent: boolean;
}
