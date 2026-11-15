import {
  PeerActionOwner,
  PeerActivityType,
  PeerMeetingFormat,
  PeerMeetingTopic,
  PeerMeetingType,
  PeerMentorSkill,
  PeerReportStatus,
  type PeerDailyReport,
  type PeerMeetingReport,
} from "@/interfaces/peer-reports";

/** A meeting report as the backend sends it; a never-saved prefill unless `overrides` say otherwise. */
export function peerMeetingReportFixture(
  overrides: Partial<PeerMeetingReport> = {},
): PeerMeetingReport {
  return {
    id: null,
    meetingId: "meeting-1",
    status: null,
    editable: true,
    mentee: {
      id: "mentee-1",
      fullName: "Ayşe Yıldız",
      department: "Endüstri Müh.",
    },
    scheduledAt: "2026-11-12T11:00:00Z",
    plannedDurationMinutes: 30,
    context: { meetingNumber: 1, previousMeeting: null, openActions: 0 },
    meetingType: PeerMeetingType.First,
    meetingFormat: PeerMeetingFormat.InPerson,
    actualDurationMinutes: 30,
    topics: [],
    menteeNeed: null,
    discussion: null,
    approach: null,
    skills: [],
    skillExample: null,
    outcome: null,
    actions: [],
    followUpNeeded: false,
    followUpAt: null,
    productivity: null,
    nextTime: null,
    coordinatorSupportNeeded: null,
    submittedAt: null,
    revisionNote: null,
    updatedAt: null,
    ...overrides,
  };
}

/** A report with every required answer, ready to send. */
export function completePeerMeetingReportFixture(
  overrides: Partial<PeerMeetingReport> = {},
): PeerMeetingReport {
  return peerMeetingReportFixture({
    id: "report-1",
    status: PeerReportStatus.Draft,
    topics: [PeerMeetingTopic.CvPreparation],
    menteeNeed: "İlk staj başvurusu.",
    discussion: "Hedef şirket listesi çıkardık.",
    approach: "Açık uçlu sorular.",
    skills: [PeerMentorSkill.ActiveListening],
    skillExample: "Sektörü kendisi daralttı.",
    outcome: "6 şirketlik liste.",
    actions: [
      {
        id: "action-1",
        text: "CV'yi yeniden yaz",
        owner: PeerActionOwner.Mentee,
        dueDate: "2026-11-15",
        done: false,
      },
    ],
    productivity: 4,
    nextTime: "Süreyi planlamak.",
    coordinatorSupportNeeded: false,
    updatedAt: "2026-11-12T11:52:00Z",
    ...overrides,
  });
}

/** The day 12 Kasım 2026 (Thursday): one meeting waiting for its report, one activity, nothing written yet. */
export function peerDailyReportFixture(
  overrides: Partial<PeerDailyReport> = {},
): PeerDailyReport {
  return {
    date: "2026-11-12",
    id: null,
    status: null,
    editable: true,
    deadline: "2026-11-12T21:00:00Z",
    late: false,
    meetings: [
      {
        meetingId: "meeting-1",
        menteeId: "mentee-1",
        menteeName: "Emre Kaya",
        scheduledAt: "2026-11-12T08:00:00Z",
        durationMinutes: 30,
        meetingType: PeerMeetingType.First,
        meetingFormat: PeerMeetingFormat.Online,
        reportStatus: null,
      },
    ],
    activities: [
      {
        id: "activity-1",
        activityDate: "2026-11-12",
        type: PeerActivityType.ResourcePrep,
        title: "Staj başvuru rehberi hazırlığı",
        durationMinutes: 90,
        menteeId: null,
        menteeName: null,
        description: null,
        createdAt: "2026-11-12T12:00:00Z",
      },
    ],
    didToday: null,
    challenge: null,
    skills: [],
    learned: null,
    tomorrowPlan: null,
    suggestedSkills: [PeerMentorSkill.ActiveListening],
    recordedMinutes: 120,
    missingMeetingReports: 1,
    submittedAt: null,
    revisionNote: null,
    updatedAt: null,
    ...overrides,
  };
}
