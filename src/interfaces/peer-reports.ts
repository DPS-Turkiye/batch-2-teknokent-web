/** One life cycle for every report level (meeting, day, week); mirrors the backend's PeerReportStatus. */
export enum PeerReportStatus {
  Draft = "DRAFT",
  InReview = "IN_REVIEW",
  Approved = "APPROVED",
  RevisionRequested = "REVISION_REQUESTED",
}

/** "Görüşme konusu" chips on the meeting report. */
export enum PeerMeetingTopic {
  InternshipApplication = "INTERNSHIP_APPLICATION",
  CvPreparation = "CV_PREPARATION",
  InterviewPrep = "INTERVIEW_PREP",
  CourseSelection = "COURSE_SELECTION",
  DepartmentExperience = "DEPARTMENT_EXPERIENCE",
  MotivationTimeManagement = "MOTIVATION_TIME_MANAGEMENT",
  CampusLife = "CAMPUS_LIFE",
  Other = "OTHER",
}

/** The mentoring skills ticked on meeting and daily reports. */
export enum PeerMentorSkill {
  ActiveListening = "ACTIVE_LISTENING",
  OpenQuestions = "OPEN_QUESTIONS",
  GoalSetting = "GOAL_SETTING",
  ResourceReferral = "RESOURCE_REFERRAL",
  Feedback = "FEEDBACK",
  ExperienceSharing = "EXPERIENCE_SHARING",
  ProblemSolving = "PROBLEM_SOLVING",
  Empathy = "EMPATHY",
  MotivationSupport = "MOTIVATION_SUPPORT",
  TimePlanning = "TIME_PLANNING",
}

export enum PeerMeetingType {
  First = "FIRST",
  FollowUp = "FOLLOW_UP",
}

export enum PeerMeetingFormat {
  InPerson = "IN_PERSON",
  Online = "ONLINE",
}

export enum PeerActivityType {
  ResourcePrep = "RESOURCE_PREP",
  MessageFollowUp = "MESSAGE_FOLLOW_UP",
  Event = "EVENT",
  Other = "OTHER",
}

/** Who an action step is for: the mentee, or the mentor ("Ben"). */
export enum PeerActionOwner {
  Mentee = "MENTEE",
  Mentor = "MENTOR",
}

export const PEER_MEETING_TOPICS = Object.values(PeerMeetingTopic);
export const PEER_MENTOR_SKILLS = Object.values(PeerMentorSkill);
export const PEER_ACTIVITY_TYPES = Object.values(PeerActivityType);

/** A held peer meeting as the report lists show it; `reportStatus` is null until a report is started. */
export type PeerReportMeeting = {
  meetingId: string;
  menteeId: string;
  menteeName: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingType: PeerMeetingType | null;
  meetingFormat: PeerMeetingFormat | null;
  reportStatus: PeerReportStatus | null;
};

export type PeerReportAction = {
  id: string;
  text: string;
  owner: PeerActionOwner;
  dueDate: string | null;
  done: boolean;
};

/** A meeting report, or the calendar's prefill of one never saved (`id` and `status` null). */
export type PeerMeetingReport = {
  id: string | null;
  meetingId: string;
  status: PeerReportStatus | null;
  editable: boolean;
  mentee: { id: string; fullName: string; department: string | null };
  scheduledAt: string;
  plannedDurationMinutes: number;
  context: {
    meetingNumber: number;
    previousMeeting: {
      meetingId: string;
      scheduledAt: string;
      topics: PeerMeetingTopic[];
    } | null;
    openActions: number;
  };
  meetingType: PeerMeetingType | null;
  meetingFormat: PeerMeetingFormat | null;
  actualDurationMinutes: number | null;
  topics: PeerMeetingTopic[];
  menteeNeed: string | null;
  discussion: string | null;
  approach: string | null;
  skills: PeerMentorSkill[];
  skillExample: string | null;
  outcome: string | null;
  actions: PeerReportAction[];
  followUpNeeded: boolean;
  followUpAt: string | null;
  productivity: number | null;
  nextTime: string | null;
  coordinatorSupportNeeded: boolean | null;
  submittedAt: string | null;
  revisionNote: string | null;
  updatedAt: string | null;
};

export type SavePeerReportActionInput = {
  id: string | null;
  text: string;
  owner: PeerActionOwner;
  dueDate: string | null;
  done: boolean;
};

export type SavePeerMeetingReportInput = {
  meetingType: PeerMeetingType | null;
  meetingFormat: PeerMeetingFormat | null;
  actualDurationMinutes: number | null;
  topics: PeerMeetingTopic[];
  menteeNeed: string | null;
  discussion: string | null;
  approach: string | null;
  skills: PeerMentorSkill[];
  skillExample: string | null;
  outcome: string | null;
  actions: SavePeerReportActionInput[];
  followUpNeeded: boolean;
  followUpAt: string | null;
  productivity: number | null;
  nextTime: string | null;
  coordinatorSupportNeeded: boolean | null;
};

export type PeerActivity = {
  id: string;
  activityDate: string;
  type: PeerActivityType;
  title: string;
  durationMinutes: number;
  menteeId: string | null;
  menteeName: string | null;
  description: string | null;
  createdAt: string;
};

export type SavePeerActivityInput = {
  activityDate: string;
  type: PeerActivityType;
  title: string;
  durationMinutes: number;
  menteeId: string | null;
  description: string | null;
};

/** One day card; `status` is null for a day nobody started, `missingMeetingReports` makes it "Eksik Bilgi". */
export type PeerReportDay = {
  date: string;
  status: PeerReportStatus | null;
  meetings: number;
  activities: number;
  missingMeetingReports: number;
};

export type PeerReportWeek = {
  weekStart: string;
  days: PeerReportDay[];
  dailySent: number;
};

/** One working day of "Faaliyet Raporum"; `recordedMinutes` is informational, never official working time. */
export type PeerDailyReport = {
  date: string;
  id: string | null;
  status: PeerReportStatus | null;
  editable: boolean;
  deadline: string;
  late: boolean;
  meetings: PeerReportMeeting[];
  activities: PeerActivity[];
  didToday: string | null;
  challenge: string | null;
  skills: PeerMentorSkill[];
  learned: string | null;
  tomorrowPlan: string | null;
  suggestedSkills: PeerMentorSkill[];
  recordedMinutes: number;
  missingMeetingReports: number;
  submittedAt: string | null;
  revisionNote: string | null;
  updatedAt: string | null;
};

export type SavePeerDailyReportInput = {
  didToday: string | null;
  challenge: string | null;
  skills: PeerMentorSkill[];
  learned: string | null;
  tomorrowPlan: string | null;
};

/** "Haftanın özeti", computed from the week's meeting reports and activities (frozen once sent). */
export type PeerWeeklySummary = {
  meetings: number;
  firstMeetings: number;
  followUpMeetings: number;
  mentees: { id: string; fullName: string }[];
  meetingReportsSent: number;
  meetingReportsTotal: number;
  activities: number;
  activityTypes: PeerActivityType[];
  recordedMinutes: number;
  skills: { skill: PeerMentorSkill; meetings: number }[];
  outcomes: {
    menteeId: string;
    fullName: string;
    meetings: number;
    reports: {
      meetingId: string;
      scheduledAt: string;
      outcome: string | null;
    }[];
    actionsDone: number;
    actionsTotal: number;
  }[];
};

export type PeerWeeklyReport = {
  weekStart: string;
  id: string | null;
  status: PeerReportStatus | null;
  editable: boolean;
  opensAt: string;
  deadline: string;
  summary: PeerWeeklySummary;
  days: PeerReportDay[];
  dailyRequired: number;
  dailySent: number;
  needsObserved: string | null;
  growth: string | null;
  nextWeekPlan: string | null;
  submittedAt: string | null;
  revisionNote: string | null;
  updatedAt: string | null;
};

export type SavePeerWeeklyReportInput = {
  needsObserved: string | null;
  growth: string | null;
  nextWeekPlan: string | null;
};
