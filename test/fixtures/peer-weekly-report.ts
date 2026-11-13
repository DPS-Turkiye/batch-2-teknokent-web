import {
  PeerActivityType,
  PeerMentorSkill,
  PeerReportStatus,
  type PeerReportDay,
  type PeerWeeklyReport,
  type PeerWeeklySummary,
} from "@/interfaces/peer-reports";

/** The 9–13 Kasım 2026 week of the Figma frame (221:521): six meetings with three mentees, all reported. */
export function weeklySummary(
  overrides: Partial<PeerWeeklySummary> = {},
): PeerWeeklySummary {
  return {
    meetings: 6,
    firstMeetings: 4,
    followUpMeetings: 2,
    mentees: [
      { id: "mentee-ayse", fullName: "Ayşe Yıldız" },
      { id: "mentee-emre", fullName: "Emre Kaya" },
      { id: "mentee-deniz", fullName: "Deniz Arslan" },
    ],
    meetingReportsSent: 6,
    meetingReportsTotal: 6,
    activities: 5,
    activityTypes: [
      PeerActivityType.ResourcePrep,
      PeerActivityType.MessageFollowUp,
      PeerActivityType.Event,
    ],
    recordedMinutes: 680,
    skills: [
      { skill: PeerMentorSkill.OpenQuestions, meetings: 5 },
      { skill: PeerMentorSkill.ActiveListening, meetings: 6 },
      { skill: PeerMentorSkill.Feedback, meetings: 1 },
    ],
    outcomes: [
      {
        menteeId: "mentee-ayse",
        fullName: "Ayşe Yıldız",
        meetings: 2,
        reports: [
          {
            meetingId: "meeting-ayse-1",
            scheduledAt: "2026-11-09T11:00:00Z",
            outcome: "6 şirketlik hedef listesi oluşturuldu.",
          },
          {
            meetingId: "meeting-ayse-2",
            scheduledAt: "2026-11-12T11:00:00Z",
            outcome: "  ",
          },
        ],
        actionsDone: 2,
        actionsTotal: 3,
      },
    ],
    ...overrides,
  };
}

export function reportDay(
  overrides: Partial<PeerReportDay> = {},
): PeerReportDay {
  return {
    date: "2026-11-09",
    status: PeerReportStatus.Approved,
    meetings: 1,
    activities: 1,
    missingMeetingReports: 0,
    ...overrides,
  };
}

const WEEK_DAYS = [
  "2026-11-09",
  "2026-11-10",
  "2026-11-11",
  "2026-11-12",
  "2026-11-13",
];

/**
 * A draft weekly report for 9 Kasım 2026: sendable from Friday 13 Kasım 18:00, due by the end of Monday 16 Kasım. The
 * backend sends the deadline as the next midnight (Tuesday 00:00 TR), as it does on main.
 */
export function weeklyReport(
  overrides: Partial<PeerWeeklyReport> = {},
): PeerWeeklyReport {
  return {
    weekStart: "2026-11-09",
    id: "weekly-1",
    status: PeerReportStatus.Draft,
    editable: true,
    opensAt: "2026-11-13T15:00:00Z",
    deadline: "2026-11-16T21:00:00Z",
    summary: weeklySummary(),
    days: WEEK_DAYS.map((date) => reportDay({ date })),
    dailyRequired: 5,
    dailySent: 5,
    needsObserved: "CV desteği",
    growth: "Açık uçlu sorular",
    nextWeekPlan: "Grup görüşmesi",
    submittedAt: null,
    revisionNote: null,
    updatedAt: "2026-11-13T12:00:00Z",
    ...overrides,
  };
}
