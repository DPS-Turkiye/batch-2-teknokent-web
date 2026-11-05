export type MentorshipGoal = {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
};

export type RegularMentorship = {
  programId?: string | null;
  programName?: string | null;
  id: string;
  mentorId: string;
  mentorName: string;
  organizationId: string;
  organizationName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  daysPerWeek: number;
  goals: string | null;
  goalItems: MentorshipGoal[];
  progressPercent: number;
};

export type MentorshipWeekCheck = {
  mentorshipId: string;
  organizationName: string;
  daysPerWeek: number;
  startDate: string;
  endDate: string | null;
  weekStart: string;
  completed: boolean;
};

export type OrganizationSummary = {
  id: string;
  name: string;
};
