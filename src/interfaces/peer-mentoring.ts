import type { PublicBadge } from "@/interfaces/badges";
import type { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

/** The board's eight peer-mentoring categories; the coordinator decides which are active. */
export enum PeerTopicCategory {
  AcademicDevelopment = "ACADEMIC_DEVELOPMENT",
  CareerInternship = "CAREER_INTERNSHIP",
  TechnicalDigital = "TECHNICAL_DIGITAL",
  ResearchAcademicCareer = "RESEARCH_ACADEMIC_CAREER",
  Entrepreneurship = "ENTREPRENEURSHIP",
  CampusLife = "CAMPUS_LIFE",
  PersonalProfessional = "PERSONAL_PROFESSIONAL",
  International = "INTERNATIONAL",
}

export const PEER_TOPIC_CATEGORIES = Object.values(PeerTopicCategory);

/** A peer program's active categories (none until its coordinator turns them on). */
export type ProgramPeerCategories = {
  programId: string;
  active: PeerTopicCategory[];
};

/**
 * A peer mentor of the student's own program, as the student sees them
 * (`GET /api/peer-mentoring/mentors?category=&q=`, the student left out).
 */
export type PeerMentorCard = {
  mentorId: string;
  fullName: string;
  department: string | null;
  classYear: number | null;
  categories: PeerTopicCategory[];
  /** The mentor's own "neye yardım edebilirim" text. */
  helpWith: string;
  /** "Neden önerildi?" lines from the student matching. */
  recommendationReasons: string[];
  /** No new mentee while every place is taken. */
  capacityFull: boolean;
  /** Active badges; a card shows the achievements. */
  badges: PublicBadge[];
};

export type PeerMentorFilter = {
  category: PeerTopicCategory | null;
  query: string;
};

export type PeerMentoringPerson = {
  userId: string;
  fullName: string;
  department: string | null;
};

/**
 * A peer-mentoring request (`GET /api/peer-mentoring/requests?as=MENTEE|MENTOR`): people only,
 * never a team (the student's hidden personal team is not shown).
 */
export type PeerMentoringRequest = {
  id: string;
  mentor: PeerMentoringPerson;
  mentee: PeerMentoringPerson;
  category: PeerTopicCategory;
  message: string;
  status: MentorshipRequestStatus;
  createdAt: string;
};

/** `POST /api/peer-mentoring/requests`; the message is 20–1000 characters. */
export type CreatePeerMentoringRequestInput = {
  mentorId: string;
  category: PeerTopicCategory;
  message: string;
};

/**
 * Where a student stands on the Mentorluk Ver side. Hidden: not a peer mentor and not in İŞKUR (no tab).
 * NoBadge: İŞKUR student without the Akran Mentoru badge ("Rozet Yok"). Earned: the badge or MENTOR is held.
 * Revoked: the badge was taken back or expired, so MENTOR is gone (D4 seam, see lib/peer-mentoring.ts).
 */
export enum PeerMentorGateState {
  Hidden = "HIDDEN",
  NoBadge = "NO_BADGE",
  Earned = "EARNED",
  Revoked = "REVOKED",
}

/** The peer mentor's own published profile (`GET /api/peer-mentoring/profile`, 404 before publishing). */
export type PeerMentorProfile = {
  categories: PeerTopicCategory[];
  subTopics: string[];
  strongCourses: string[];
  projects: string[];
  erasmus: string | null;
  helpWith: string;
  linkedinUrl: string | null;
  department: string | null;
  classYear: number | null;
  menteeCapacity: number | null;
};

/** The wizard's answers (`PUT /api/peer-mentoring/profile`); helpWith is 20–2000 characters. */
export type SavePeerMentorProfileInput = {
  categories: PeerTopicCategory[];
  subTopics: string[];
  strongCourses: string[];
  projects: string[];
  erasmus: string;
  helpWith: string;
  linkedinUrl: string;
};
