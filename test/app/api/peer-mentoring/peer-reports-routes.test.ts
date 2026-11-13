import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DELETE as deleteActivityRoute,
  PUT as updateActivityRoute,
} from "@/app/api/peer-mentoring/reports/activities/[activityId]/route";
import { POST as addActivityRoute } from "@/app/api/peer-mentoring/reports/activities/route";
import {
  GET as dayRoute,
  PUT as saveDayRoute,
} from "@/app/api/peer-mentoring/reports/days/[date]/route";
import { POST as submitDayRoute } from "@/app/api/peer-mentoring/reports/days/[date]/submit/route";
import { GET as weekRoute } from "@/app/api/peer-mentoring/reports/days/route";
import { PATCH as actionRoute } from "@/app/api/peer-mentoring/reports/meetings/[meetingId]/actions/[actionId]/route";
import {
  GET as meetingReportRoute,
  PUT as saveMeetingReportRoute,
} from "@/app/api/peer-mentoring/reports/meetings/[meetingId]/route";
import { POST as submitMeetingReportRoute } from "@/app/api/peer-mentoring/reports/meetings/[meetingId]/submit/route";
import { GET as meetingsRoute } from "@/app/api/peer-mentoring/reports/meetings/route";
import {
  PUT as saveWeeklyRoute,
  GET as weeklyRoute,
} from "@/app/api/peer-mentoring/reports/weeks/[weekStart]/route";
import { POST as submitWeeklyRoute } from "@/app/api/peer-mentoring/reports/weeks/[weekStart]/submit/route";
import {
  PeerActivityType,
  PeerMeetingTopic,
  PeerMentorSkill,
} from "@/interfaces/peer-reports";
import { UserRole } from "@/interfaces/session";
import * as api from "@/lib/api/peer-reports";
import { getSessionUser } from "@/lib/session";
import tr from "@/messages/tr.json";
import {
  answerAllWith200,
  itChecksTheBody,
  jsonRequest,
  type BodyCase,
} from "@test/app/api/body-validation";
import { withForgedActor } from "@test/fixtures/forged-actor";
import { backendRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/peer-reports");
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const MENTOR = "mentor-1";
const MEETING = "8c5f0f0e-6a3e-4c55-9d2d-2a7c7b1f0a11";
const ACTION = "5b2e1a9c-0d3f-4e7a-8b6c-1f2e3d4c5b6a";
const ACTIVITY = "1f0e2d3c-4b5a-4968-8776-655443322110";
const DAY = "2026-11-12";
const WEEK = "2026-11-09";

const meetingParams = (meetingId = MEETING) => ({
  params: Promise.resolve({ meetingId }),
});
const dayParams = (date = DAY) => ({ params: Promise.resolve({ date }) });
const weekParams = (weekStart = WEEK) => ({
  params: Promise.resolve({ weekStart }),
});
const activityParams = (activityId = ACTIVITY) => ({
  params: Promise.resolve({ activityId }),
});

/** How many times any backend wrapper was called. */
function backendCalls() {
  return Object.values(api)
    .filter((call) => vi.isMockFunction(call))
    .reduce((total, call) => total + call.mock.calls.length, 0);
}

function get(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}

beforeEach(() => {
  vi.clearAllMocks();
  answerAllWith200(api);
  vi.mocked(getSessionUser).mockResolvedValue({
    userId: MENTOR,
    email: "mert@odtu-dev.invalid",
    fullName: "Mert Demir",
    jobTitle: "",
    role: UserRole.Mentee,
  });
});

describe("peer report proxy routes", () => {
  it("refuse without a session and never call the backend", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const answers = await Promise.all([
      meetingsRoute(get(`/x?from=${WEEK}&to=${DAY}`)),
      meetingReportRoute(get("/x"), meetingParams()),
      submitMeetingReportRoute(get("/x"), meetingParams()),
      weekRoute(get(`/x?week=${WEEK}`)),
      dayRoute(get("/x"), dayParams()),
      submitDayRoute(get("/x"), dayParams()),
      deleteActivityRoute(get("/x"), activityParams()),
      weeklyRoute(get("/x"), weekParams()),
      submitWeeklyRoute(get("/x"), weekParams()),
    ]);

    expect(answers.map((answer) => answer.status)).toEqual(
      Array(answers.length).fill(401),
    );
    expect(backendCalls()).toBe(0);
  });

  it("read and send as the session's mentor, whatever the URL says", async () => {
    await meetingsRoute(get(`/x?from=${WEEK}&to=${DAY}&actorId=someone`));
    await meetingReportRoute(get("/x?actorId=someone"), meetingParams());
    await submitMeetingReportRoute(get("/x"), meetingParams());
    await weekRoute(get(`/x?week=${WEEK}`));
    await dayRoute(get("/x"), dayParams());
    await submitDayRoute(get("/x"), dayParams());
    await deleteActivityRoute(get("/x"), activityParams());
    await weeklyRoute(get("/x"), weekParams());
    await submitWeeklyRoute(get("/x"), weekParams());

    expect(api.fetchPeerReportMeetings).toHaveBeenCalledWith(MENTOR, WEEK, DAY);
    expect(api.fetchPeerMeetingReport).toHaveBeenCalledWith(MENTOR, MEETING);
    expect(api.submitPeerMeetingReport).toHaveBeenCalledWith(MENTOR, MEETING);
    expect(api.fetchPeerReportWeek).toHaveBeenCalledWith(MENTOR, WEEK);
    expect(api.fetchPeerDailyReport).toHaveBeenCalledWith(MENTOR, DAY);
    expect(api.submitPeerDailyReport).toHaveBeenCalledWith(MENTOR, DAY);
    expect(api.deletePeerActivity).toHaveBeenCalledWith(MENTOR, ACTIVITY);
    expect(api.fetchPeerWeeklyReport).toHaveBeenCalledWith(MENTOR, WEEK);
    expect(api.submitPeerWeeklyReport).toHaveBeenCalledWith(MENTOR, WEEK);
  });

  it("refuse an id that isn't a uuid and a day that isn't yyyy-mm-dd before the backend", async () => {
    const answers = await Promise.all([
      meetingReportRoute(get("/x"), meetingParams("../days")),
      submitMeetingReportRoute(get("/x"), meetingParams("x")),
      dayRoute(get("/x"), dayParams("12.11.2026")),
      submitDayRoute(get("/x"), dayParams("..")),
      deleteActivityRoute(get("/x"), activityParams("1")),
      weeklyRoute(get("/x"), weekParams("next")),
      submitWeeklyRoute(get("/x"), weekParams("2026-11")),
      meetingsRoute(get(`/x?from=${WEEK}`)),
      meetingsRoute(get(`/x?from=yesterday&to=${DAY}`)),
      weekRoute(get("/x")),
      actionRoute(jsonRequest({ done: true }, "PATCH"), {
        params: Promise.resolve({ meetingId: MEETING, actionId: "a/b" }),
      }),
    ]);

    expect(answers.map((answer) => answer.status)).toEqual(
      Array(answers.length).fill(400),
    );
    expect(backendCalls()).toBe(0);
  });

  it("pass the backend's 404 and 409 through as they are", async () => {
    vi.mocked(api.fetchPeerMeetingReport).mockResolvedValueOnce(
      backendRefusal(404),
    );
    vi.mocked(api.submitPeerDailyReport).mockResolvedValueOnce(
      backendRefusal(409),
    );

    expect((await meetingReportRoute(get("/x"), meetingParams())).status).toBe(
      404,
    );
    expect((await submitDayRoute(get("/x"), dayParams())).status).toBe(409);
  });

  it("answer 502 with its own message when the backend call fails", async () => {
    vi.mocked(api.fetchPeerDailyReport).mockRejectedValueOnce(
      new Error("socket hang up"),
    );

    const response = await dayRoute(get("/x"), dayParams());

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({
      message: tr.apiErrors.peerReportsLoadFailed,
    });
  });
});

const bodyCases: BodyCase[] = [
  {
    route: "PUT meetings/[meetingId]",
    method: "PUT",
    send: (request) => saveMeetingReportRoute(request, meetingParams()),
    valid: withForgedActor({
      topics: [PeerMeetingTopic.CvPreparation],
      skills: [PeerMentorSkill.ActiveListening],
      discussion: "Hedef listesi",
      productivity: 4,
      actions: [{ text: "CV", owner: "MENTEE", dueDate: "2026-11-15" }],
    }),
    backend: api.savePeerMeetingReport,
    expected: [
      MENTOR,
      MEETING,
      expect.objectContaining({
        topics: [PeerMeetingTopic.CvPreparation],
        discussion: "Hedef listesi",
        productivity: 4,
        meetingType: null,
        followUpNeeded: false,
        actions: [
          {
            id: null,
            text: "CV",
            owner: "MENTEE",
            dueDate: "2026-11-15",
            done: false,
          },
        ],
      }),
    ],
    invalid: {
      "an unknown topic": { topics: ["GOSSIP"] },
      "a productivity of 6": { productivity: 6 },
      "a duration of 0": { actualDurationMinutes: 0 },
      "an empty action": { actions: [{ text: " ", owner: "MENTEE" }] },
      "an action id that isn't a uuid": {
        actions: [{ id: "x", text: "CV", owner: "MENTEE" }],
      },
      "too long a text": { discussion: "x".repeat(4001) },
      "a follow-up time without an offset": { followUpAt: "2026-11-19T11:00" },
    },
  },
  {
    route: "PATCH meetings/[meetingId]/actions/[actionId]",
    method: "PATCH",
    send: (request) =>
      actionRoute(request, {
        params: Promise.resolve({ meetingId: MEETING, actionId: ACTION }),
      }),
    valid: withForgedActor({ done: true }),
    backend: api.updatePeerReportAction,
    expected: [MENTOR, MEETING, ACTION, true],
    invalid: { "no done flag": {}, "a done string": { done: "yes" } },
  },
  {
    route: "PUT days/[date]",
    method: "PUT",
    send: (request) => saveDayRoute(request, dayParams()),
    valid: withForgedActor({
      didToday: "İki görüşme",
      skills: [PeerMentorSkill.Empathy],
    }),
    backend: api.savePeerDailyReport,
    expected: [
      MENTOR,
      DAY,
      {
        didToday: "İki görüşme",
        challenge: null,
        skills: [PeerMentorSkill.Empathy],
        learned: null,
        tomorrowPlan: null,
      },
    ],
    invalid: {
      "an unknown skill": { skills: ["CHARM"] },
      "too long an answer": { learned: "x".repeat(4001) },
    },
  },
  {
    route: "POST activities",
    send: addActivityRoute,
    valid: withForgedActor({
      activityDate: DAY,
      type: PeerActivityType.ResourcePrep,
      title: " Staj rehberi ",
      durationMinutes: 90,
    }),
    backend: api.addPeerActivity,
    expected: [
      MENTOR,
      {
        activityDate: DAY,
        type: PeerActivityType.ResourcePrep,
        title: "Staj rehberi",
        durationMinutes: 90,
        menteeId: null,
        description: null,
      },
    ],
    invalid: {
      "no date": { type: "EVENT", title: "Etkinlik", durationMinutes: 30 },
      "an unknown type": {
        activityDate: DAY,
        type: "PARTY",
        title: "x",
        durationMinutes: 30,
      },
      "no minutes": { activityDate: DAY, type: "EVENT", title: "x" },
      "a whole day and more": {
        activityDate: DAY,
        type: "EVENT",
        title: "x",
        durationMinutes: 721,
      },
      "a mentee id that isn't a uuid": {
        activityDate: DAY,
        type: "EVENT",
        title: "x",
        durationMinutes: 30,
        menteeId: "someone",
      },
    },
  },
  {
    route: "PUT activities/[activityId]",
    method: "PUT",
    send: (request) => updateActivityRoute(request, activityParams()),
    valid: {
      activityDate: DAY,
      type: PeerActivityType.Event,
      title: "Kariyer günü",
      durationMinutes: 60,
    },
    backend: api.updatePeerActivity,
    expected: [
      MENTOR,
      ACTIVITY,
      expect.objectContaining({ title: "Kariyer günü" }),
    ],
    invalid: {
      "an empty title": {
        activityDate: DAY,
        type: "EVENT",
        title: "",
        durationMinutes: 5,
      },
    },
  },
  {
    route: "PUT weeks/[weekStart]",
    method: "PUT",
    send: (request) => saveWeeklyRoute(request, weekParams()),
    valid: withForgedActor({ needsObserved: "CV desteği" }),
    backend: api.savePeerWeeklyReport,
    expected: [
      MENTOR,
      WEEK,
      { needsObserved: "CV desteği", growth: null, nextWeekPlan: null },
    ],
    invalid: { "too long an answer": { growth: "x".repeat(4001) } },
  },
];

describe.each(bodyCases)("$route body", (bodyCase) => {
  itChecksTheBody(bodyCase);
});
