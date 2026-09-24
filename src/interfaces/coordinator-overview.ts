import type { ProgramLifecycle } from "@/interfaces/coordinator-program";

export enum CoordinatorAgendaKind {
  Meeting = "MEETING",
  Event = "EVENT",
  Deadline = "DEADLINE",
  Action = "ACTION",
}

export type CoordinatorAgendaItem = {
  kind: CoordinatorAgendaKind;
  title: string;
  subtitle: string | null;
  at: string;
  allDay: boolean;
};

export type CoordinatorNextMeeting = {
  meetingId: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number | null;
  meetLink: string | null;
  sequence: number;
  mentorId: string;
  mentorName: string;
  mentorTitle: string | null;
  organizationId: string;
  organizationName: string;
  founderName: string | null;
};

/** The coordinator home (`GET /api/coordinator/overview`). */
export type CoordinatorOverview = {
  programs: { id: string; name: string; lifecycle: ProgramLifecycle }[];
  metrics: {
    activeMentorships: number;
    mentoredTeams: number;
    activeMentors: number;
    staleMentorships: number;
    overdueActions: number;
    openBottlenecks: number;
    slowMentors: number;
  };
  nextMeeting: CoordinatorNextMeeting | null;
  agenda: CoordinatorAgendaItem[];
  actions: {
    pendingMentors: {
      mentorId: string;
      mentorName: string;
      programId: string;
      programName: string;
      waitingDays: number;
    }[];
    awaitingTeams: {
      organizationId: string;
      name: string;
      programId: string;
      programName: string;
      waitingDays: number;
    }[];
    missingNotes: {
      meetingId: string;
      scheduledAt: string;
      mentorName: string;
      organizationName: string;
    }[];
  };
};
