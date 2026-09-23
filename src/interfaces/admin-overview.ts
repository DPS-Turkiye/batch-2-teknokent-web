export type AdminProgram = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  createdAt: string;
  coordinatorId: string;
  coordinatorName: string;
  startupCount: number;
  acceptedMentorCount: number;
  pendingMentorCount: number;
  startups: AdminStartup[];
  mentors: AdminMentorMembership[];
};

export type AdminStartup = {
  id: string;
  name: string;
  sector: string | null;
  programId: string;
  programName: string;
  founderName?: string | null;
  founderJobTitle?: string | null;
};

export type AdminMentorMembership = {
  mentorId: string;
  fullName: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "COORDINATOR" | "MENTOR" | "MENTEE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  organizationId: string | null;
  organizationName: string | null;
  jobTitle: string | null;
  createdAt?: string | null;
  expertise?: string[];
};

export type AdminMentorship = {
  id: string;
  mentorId: string;
  mentorName: string;
  organizationId: string;
  organizationName: string;
  status: "PLANNED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string | null;
  progressPercent: number;
  daysSinceMeeting: number | null;
  goalDone?: number;
  goalTotal?: number;
};

export type AdminMeetingMark = {
  mentorId: string;
  organizationId: string;
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

export type AdminRequest = {
  id: string;
  organizationId: string;
  organizationName: string;
  mentorId: string | null;
  mentorName: string | null;
  supportArea: string | null;
  status: string;
  createdAt: string;
};

export type AdminBottleneck = {
  id: string;
  title: string;
  severity: string;
  status: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
};

export type AdminOverview = {
  programs: AdminProgram[];
  users: AdminUser[];
  mentorships: AdminMentorship[];
  requests: AdminRequest[];
  bottlenecks: AdminBottleneck[];
  meetingsLast8Weeks: number;
  meetings?: AdminMeetingMark[];
};
