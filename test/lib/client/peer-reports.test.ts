import { describe, vi } from "vitest";

import {
  PeerActionOwner,
  PeerActivityType,
  type SavePeerActivityInput,
  type SavePeerMeetingReportInput,
} from "@/interfaces/peer-reports";
import {
  addPeerActivity,
  deletePeerActivity,
  getPeerDailyReport,
  getPeerMeetingReport,
  getPeerReportMeetings,
  getPeerReportWeek,
  getPeerWeeklyReport,
  savePeerDailyReport,
  savePeerMeetingReport,
  savePeerWeeklyReport,
  setPeerReportActionDone,
  submitPeerDailyReport,
  submitPeerMeetingReport,
  submitPeerWeeklyReport,
  updatePeerActivity,
} from "@/lib/client/peer-reports";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const MEETING = "meeting/1";
const meetingReport: SavePeerMeetingReportInput = {
  meetingType: null,
  meetingFormat: null,
  actualDurationMinutes: 35,
  topics: [],
  menteeNeed: null,
  discussion: "Hedef listesi",
  approach: null,
  skills: [],
  skillExample: null,
  outcome: null,
  actions: [
    {
      id: null,
      text: "CV'yi yeniden yaz",
      owner: PeerActionOwner.Mentee,
      dueDate: "2026-11-15",
      done: false,
    },
  ],
  followUpNeeded: false,
  followUpAt: null,
  productivity: null,
  nextTime: null,
  coordinatorSupportNeeded: null,
};
const activity: SavePeerActivityInput = {
  activityDate: "2026-11-12",
  type: PeerActivityType.ResourcePrep,
  title: "Staj rehberi",
  durationMinutes: 90,
  menteeId: null,
  description: null,
};
const daily = {
  didToday: "İki görüşme",
  challenge: null,
  skills: [],
  learned: null,
  tomorrowPlan: null,
};
const weekly = { needsObserved: "CV", growth: null, nextWeekPlan: null };

const calls: ClientCall[] = [
  {
    title: "getPeerReportMeetings asks for the days",
    call: () => getPeerReportMeetings("2026-11-09", "2026-11-13"),
    method: "get",
    args: [
      "/api/peer-mentoring/reports/meetings",
      { params: { from: "2026-11-09", to: "2026-11-13" } },
    ],
  },
  {
    title: "getPeerMeetingReport encodes the meeting id",
    call: () => getPeerMeetingReport(MEETING),
    method: "get",
    args: ["/api/peer-mentoring/reports/meetings/meeting%2F1"],
  },
  {
    title: "savePeerMeetingReport puts the draft",
    call: () => savePeerMeetingReport(MEETING, meetingReport),
    method: "put",
    args: ["/api/peer-mentoring/reports/meetings/meeting%2F1", meetingReport],
  },
  {
    title: "submitPeerMeetingReport posts to submit",
    call: () => submitPeerMeetingReport(MEETING),
    method: "post",
    args: ["/api/peer-mentoring/reports/meetings/meeting%2F1/submit"],
  },
  {
    title: "setPeerReportActionDone patches one action",
    call: () => setPeerReportActionDone(MEETING, "action-1", true),
    method: "patch",
    args: [
      "/api/peer-mentoring/reports/meetings/meeting%2F1/actions/action-1",
      { done: true },
    ],
  },
  {
    title: "getPeerReportWeek asks for the week's day cards",
    call: () => getPeerReportWeek("2026-11-09"),
    method: "get",
    args: [
      "/api/peer-mentoring/reports/days",
      { params: { week: "2026-11-09" } },
    ],
  },
  {
    title: "getPeerDailyReport reads one day",
    call: () => getPeerDailyReport("2026-11-12"),
    method: "get",
    args: ["/api/peer-mentoring/reports/days/2026-11-12"],
  },
  {
    title: "savePeerDailyReport puts the answers",
    call: () => savePeerDailyReport("2026-11-12", daily),
    method: "put",
    args: ["/api/peer-mentoring/reports/days/2026-11-12", daily],
  },
  {
    title: "submitPeerDailyReport posts to submit",
    call: () => submitPeerDailyReport("2026-11-12"),
    method: "post",
    args: ["/api/peer-mentoring/reports/days/2026-11-12/submit"],
  },
  {
    title: "addPeerActivity posts the activity",
    call: () => addPeerActivity(activity),
    method: "post",
    args: ["/api/peer-mentoring/reports/activities", activity],
  },
  {
    title: "updatePeerActivity puts the activity",
    call: () => updatePeerActivity("activity-1", activity),
    method: "put",
    args: ["/api/peer-mentoring/reports/activities/activity-1", activity],
  },
  {
    title: "deletePeerActivity deletes it",
    call: () => deletePeerActivity("activity-1"),
    method: "delete",
    args: ["/api/peer-mentoring/reports/activities/activity-1"],
    returnsNothing: true,
  },
  {
    title: "getPeerWeeklyReport reads the week",
    call: () => getPeerWeeklyReport("2026-11-09"),
    method: "get",
    args: ["/api/peer-mentoring/reports/weeks/2026-11-09"],
  },
  {
    title: "savePeerWeeklyReport puts the three answers",
    call: () => savePeerWeeklyReport("2026-11-09", weekly),
    method: "put",
    args: ["/api/peer-mentoring/reports/weeks/2026-11-09", weekly],
  },
  {
    title: "submitPeerWeeklyReport posts to submit",
    call: () => submitPeerWeeklyReport("2026-11-09"),
    method: "post",
    args: ["/api/peer-mentoring/reports/weeks/2026-11-09/submit"],
  },
];

describe("peer report client", () => {
  itSendsEachClientCall(calls);
});
