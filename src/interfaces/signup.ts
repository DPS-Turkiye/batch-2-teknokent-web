import { DocumentKind } from "@/interfaces/startup-document";
import type { Keyed } from "@/lib/keyed-list";

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

/** The wizard's steps in order; their copy is `signupWizard.steps.<key>`. */
export const SIGNUP_STEPS: { step: SignupStep }[] = [
  { step: SignupStep.PersonalProfile },
  { step: SignupStep.StartupProfile },
  { step: SignupStep.Documents },
  { step: SignupStep.Review },
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

/**
 * The four documents the signup wizard asks a startup for. A subset of DocumentKind rather than an enum of its own,
 * so a signup file's kind is a DocumentKind wherever stored documents are looked up or uploaded.
 */
export const StartupDocumentKind = {
  Canvas: DocumentKind.Canvas,
  PitchDeck: DocumentKind.PitchDeck,
  Mvp: DocumentKind.Mvp,
  Validation: DocumentKind.Validation,
} as const;
export type StartupDocumentKind =
  (typeof StartupDocumentKind)[keyof typeof StartupDocumentKind];

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
  /** Rows carry React keys while edited (see keyed-list); the saved draft and the payloads leave them out. */
  teamMembers: Keyed<TeamMemberDraft>[];
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
