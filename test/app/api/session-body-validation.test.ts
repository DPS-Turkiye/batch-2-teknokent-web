import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as declineProposalRoute } from "@/app/api/meeting-proposals/[id]/decline/route";
import { POST as feedbackRoute } from "@/app/api/meetings/[id]/feedback/route";
import { POST as rescheduleRoute } from "@/app/api/meetings/[id]/reschedule-proposals/route";
import { POST as createMentorRequestRoute } from "@/app/api/mentor-requests/route";
import { PATCH as goalDoneRoute } from "@/app/api/mentorships/[id]/goals/[goalId]/route";
import { POST as addGoalRoute } from "@/app/api/mentorships/[id]/goals/route";
import { PATCH as updateMentorshipRoute } from "@/app/api/mentorships/[id]/route";
import { PUT as weekCheckRoute } from "@/app/api/mentorships/[id]/week-checks/route";
import { POST as startMentorshipRoute } from "@/app/api/mentorships/route";
import * as proposals from "@/lib/api/meeting-proposals";
import * as meetings from "@/lib/api/meetings";
import * as mentorRequests from "@/lib/api/mentor-requests";
import * as mentorships from "@/lib/api/mentorships";
import * as startupProcess from "@/lib/api/startup-process";
import {
  getSessionIds,
  getSessionMentorId,
  getSessionUser,
  refreshSessionUser,
} from "@/lib/session";
import {
  answerAllWith200,
  itChecksTheBody,
  jsonRequest,
  type BodyCase,
} from "@test/app/api/body-validation";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/meeting-proposals");
vi.mock("@/lib/api/meetings");
vi.mock("@/lib/api/mentor-requests");
vi.mock("@/lib/api/mentorships");
vi.mock("@/lib/api/startup-process");
vi.mock("@/lib/session");

const sessionIds = { userId: "user-1", organizationId: "org-1" };
const signedIn = appSession({ userId: "user-1", organizationId: "org-1" });
const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const mentorship = withId("mentorship-1");

const cases: BodyCase[] = [
  {
    route: "POST /api/meeting-proposals/[id]/decline",
    send: (request) => declineProposalRoute(request, withId("proposal-1")),
    valid: { reason: "O gün doluyum." },
    backend: proposals.declineMeetingProposal,
    expected: ["user-1", "proposal-1", "O gün doluyum."],
    invalid: { "a reason of the wrong type": { reason: 5 } },
  },
  {
    route: "POST /api/meetings/[id]/reschedule-proposals",
    send: (request) => rescheduleRoute(request, withId("meeting-1")),
    valid: { scheduledAt: "2026-11-20T10:00:00Z", durationMinutes: 30 },
    backend: proposals.proposeReschedule,
    expected: [
      "user-1",
      "meeting-1",
      { scheduledAt: "2026-11-20T10:00:00Z", durationMinutes: 30 },
    ],
    invalid: {
      "a missing duration (once read as 0 minutes)": {
        scheduledAt: "2026-11-20T10:00:00Z",
      },
    },
  },
  {
    route: "POST /api/mentorships",
    send: (request) => startMentorshipRoute(request),
    valid: {
      organizationId: "org-1",
      startDate: "2026-11-01",
      endDate: "2027-01-31",
      daysPerWeek: 9,
    },
    backend: mentorships.createRegularMentorship,
    expected: [
      {
        mentorId: "mentor-1",
        organizationId: "org-1",
        status: "ACTIVE",
        startDate: "2026-11-01",
        endDate: "2027-01-31",
        daysPerWeek: 7,
      },
    ],
    invalid: {
      "a missing end date": {
        organizationId: "org-1",
        startDate: "2026-11-01",
        daysPerWeek: 1,
      },
      "days per week sent as text": {
        organizationId: "org-1",
        startDate: "2026-11-01",
        endDate: "2027-01-31",
        daysPerWeek: "2",
      },
    },
  },
  {
    route: "PATCH /api/mentorships/[id]",
    method: "PATCH",
    send: (request) => updateMentorshipRoute(request, mentorship),
    valid: { startDate: "2026-11-01", endDate: null, daysPerWeek: 2 },
    backend: mentorships.updateRegularMentorship,
    expected: [
      {
        mentorshipId: "mentorship-1",
        actorId: "mentor-1",
        startDate: "2026-11-01",
        endDate: null,
        daysPerWeek: 2,
      },
    ],
    invalid: { "missing days per week": { startDate: "2026-11-01" } },
  },
  {
    route: "PUT /api/mentorships/[id]/week-checks",
    method: "PUT",
    send: (request) => weekCheckRoute(request, mentorship),
    valid: { weekStart: "2026-11-09", completed: true },
    backend: mentorships.upsertMentorshipWeekCheck,
    expected: [
      {
        mentorshipId: "mentorship-1",
        actorId: "mentor-1",
        weekStart: "2026-11-09",
        completed: true,
      },
    ],
    invalid: {
      "a flag sent as text": { weekStart: "2026-11-09", completed: "yes" },
      "an empty week": { weekStart: "", completed: true },
    },
  },
  {
    route: "POST /api/mentorships/[id]/goals",
    send: (request) => addGoalRoute(request, mentorship),
    valid: { title: "  MVP'yi bitir " },
    backend: mentorships.createMentorshipGoal,
    expected: [
      {
        mentorshipId: "mentorship-1",
        actorId: "mentor-1",
        title: "MVP'yi bitir",
      },
    ],
    invalid: { "a blank title": { title: "   " } },
  },
  {
    route: "PATCH /api/mentorships/[id]/goals/[goalId]",
    method: "PATCH",
    send: (request) =>
      goalDoneRoute(request, {
        params: Promise.resolve({ id: "mentorship-1", goalId: "goal-1" }),
      }),
    valid: { done: true },
    backend: mentorships.updateMentorshipGoal,
    expected: [
      {
        mentorshipId: "mentorship-1",
        goalId: "goal-1",
        actorId: "mentor-1",
        done: true,
      },
    ],
    invalid: {
      "no flag (once read as not done)": {},
      "a flag sent as text": { done: "true" },
    },
  },
  {
    route: "POST /api/meetings/[id]/feedback (handed on as it came)",
    send: (request) => feedbackRoute(request, withId("meeting-1")),
    valid: { rating: 5, comment: "Faydalı" },
    backend: meetings.submitMeetingFeedback,
    expected: ["meeting-1", "user-1", { rating: 5, comment: "Faydalı" }],
    invalid: { "an array": [5], null: null },
  },
  {
    route: "POST /api/mentor-requests (handed on as it came)",
    send: (request) => createMentorRequestRoute(request),
    valid: { mentorId: "mentor-1", topics: ["finance"] },
    backend: mentorRequests.createMentorRequest,
    expected: [sessionIds, { mentorId: "mentor-1", topics: ["finance"] }],
    invalid: { "a string": '"hello"' },
  },
];

function signIn() {
  vi.mocked(getSessionIds).mockResolvedValue(sessionIds);
  vi.mocked(getSessionUser).mockResolvedValue(signedIn);
  vi.mocked(getSessionMentorId).mockResolvedValue("mentor-1");
  vi.mocked(refreshSessionUser).mockResolvedValue(signedIn);
  answerAllWith200(
    proposals,
    meetings,
    mentorRequests,
    mentorships,
    startupProcess,
  );
}

describe.each(cases)("$route", (bodyCase) => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
  });

  itChecksTheBody(bodyCase);
});

describe("declining a meeting proposal without a body", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signIn();
  });

  it("still declines, with no reason", async () => {
    const response = await declineProposalRoute(
      jsonRequest(undefined),
      withId("proposal-1"),
    );

    expect(response.status).toBe(200);
    expect(proposals.declineMeetingProposal).toHaveBeenCalledWith(
      "user-1",
      "proposal-1",
      null,
    );
  });
});
