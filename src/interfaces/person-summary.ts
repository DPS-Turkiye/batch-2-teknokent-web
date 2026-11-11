import type {
  MentorEducation,
  MentorExperience,
  MentorLanguage,
} from "@/interfaces/mentor";
import type { ProgramMentorStatus, ProgramStatus } from "@/interfaces/program";
import type { UserAccountStatus, UserRole } from "@/interfaces/session";

/** Mirrors the backend PersonProgramRelation. */
export enum PersonProgramRelation {
  Mentor = "MENTOR",
  Mentee = "MENTEE",
}

export interface PersonSummaryMentor {
  professionalTitle: string | null;
  company: string | null;
  about: string | null;
  experienceLevel: string | null;
  sectorExperience: string | null;
  startupStages: string | null;
  specialties: string[];
  offerings: string[];
  languages: MentorLanguage[];
  experiences: MentorExperience[];
  educations: MentorEducation[];
  menteeCapacity: number | null;
  meetingMode: string | null;
  activeMenteeCount: number;
  completedMentorshipCount: number;
}

export interface PersonSummaryStartup {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  sector: string | null;
  maturity: string | null;
  problem: string | null;
  solution: string | null;
  fundingStage: string | null;
  foundedYear: number | null;
}

export interface PersonSummaryProgram {
  id: string;
  name: string;
  status: ProgramStatus;
  relation: PersonProgramRelation;
  /** Set on mentor rows only. */
  mentorStatus: ProgramMentorStatus | null;
}

/** GET /api/users/{id}/summary: the admin and coordinator profile page. No phone number on purpose. */
export interface PersonSummary {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserAccountStatus;
  jobTitle: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  expertise: string[];
  createdAt: string | null;
  mentor: PersonSummaryMentor | null;
  startup: PersonSummaryStartup | null;
  programs: PersonSummaryProgram[];
}
