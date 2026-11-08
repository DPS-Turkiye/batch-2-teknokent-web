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

/**
 * A student who earned the peer-mentor badge and published a profile, as a mentee sees them.
 * Planned backend: `GET /api/peer-mentors?category=&q=`, own profile left out.
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
};

export type PeerMentorFilter = {
  category: PeerTopicCategory | null;
  query: string;
};

/** A request the student sent. Planned backend: `GET /api/peer-mentoring/requests?as=MENTEE`. */
export type PeerMentoringRequest = {
  id: string;
  mentor: Pick<PeerMentorCard, "mentorId" | "fullName" | "department">;
  category: PeerTopicCategory;
  message: string;
  status: MentorshipRequestStatus;
  createdAt: string;
};

/** Planned backend: `POST /api/peer-mentoring/requests`. */
export type CreatePeerMentoringRequestInput = {
  mentorId: string;
  category: PeerTopicCategory;
  message: string;
};
