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
