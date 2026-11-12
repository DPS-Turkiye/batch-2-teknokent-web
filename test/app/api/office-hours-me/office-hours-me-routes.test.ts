import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getAcademician } from "@/app/api/office-hours/me/academicians/[id]/route";
import { GET as getSlots } from "@/app/api/office-hours/me/academicians/[id]/slots/route";
import { GET as getAcademicians } from "@/app/api/office-hours/me/academicians/route";
import { GET as getAppointments } from "@/app/api/office-hours/me/appointments/route";
import {
  GET as getAvailability,
  PUT as putAvailability,
} from "@/app/api/office-hours/me/availability/route";
import { GET as getInbox } from "@/app/api/office-hours/me/inbox/route";
import { GET as getMeetings } from "@/app/api/office-hours/me/meetings/route";
import {
  GET as getProfile,
  PUT as putProfile,
} from "@/app/api/office-hours/me/profile/route";
import { POST as postAlternative } from "@/app/api/office-hours/me/requests/[id]/alternative/route";
import { POST as postDecision } from "@/app/api/office-hours/me/requests/[id]/decision/route";
import { POST as postRequest } from "@/app/api/office-hours/me/requests/route";
import { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import { Weekday } from "@/interfaces/mentor";
import { UserRole } from "@/interfaces/session";
import * as officeHours from "@/lib/api/office-hours-me";
import { getSessionUser } from "@/lib/session";
import { withForgedActor } from "@test/fixtures/forged-actor";
import { backendRefusal, backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/office-hours-me", () => ({
  fetchMyOfficeHoursAvailability: vi.fn(),
  saveMyOfficeHoursAvailability: vi.fn(),
  fetchMyOfficeHoursProfile: vi.fn(),
  saveMyOfficeHoursProfile: vi.fn(),
  fetchOfficeHoursInbox: vi.fn(),
  answerOfficeHoursRequest: vi.fn(),
  fetchAcademicianOfficeHoursMeetings: vi.fn(),
  fetchListedAcademicians: vi.fn(),
  fetchListedAcademician: vi.fn(),
  fetchAcademicianOpenSlots: vi.fn(),
  createOfficeHoursRequest: vi.fn(),
  fetchMyOfficeHoursRequests: vi.fn(),
  answerOfficeHoursAlternative: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

const SESSION = {
  userId: "user-1",
  email: "elif@odtu-dev.invalid",
  fullName: "Elif Şahin",
  jobTitle: "",
  role: UserRole.Academician,
};

function request(url: string, method = "GET", body?: unknown) {
  return new NextRequest(new URL(url, "http://localhost"), {
    method,
    ...(body === undefined
      ? {}
      : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}

const ACADEMICIAN = "6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b";

const withId = (id: string) => ({ params: Promise.resolve({ id }) });

const backendHours = {
  rules: [
    {
      id: "rule-1",
      dayOfWeek: Weekday.Tuesday,
      startTime: "10:00",
      endTime: "12:00",
      slotMinutes: 30,
    },
  ],
  exceptions: [],
  studentCapacity: 4,
  defaultMeetingDurationMinutes: 30,
  meetingBufferMinutes: 0,
};
const editorHours = {
  rules: [
    {
      dayOfWeek: Weekday.Tuesday,
      startTime: "10:00",
      endTime: "12:00",
      slotMinutes: 30,
    },
  ],
  exceptions: [],
  menteeCapacity: 4,
  defaultMeetingDurationMinutes: 30,
  meetingBufferMinutes: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(SESSION);
  for (const value of Object.values(officeHours)) {
    if (vi.isMockFunction(value)) value.mockResolvedValue(backendResponse({}));
  }
});

/** Every handler, called with a body it accepts. */
const handlers: [string, () => Promise<Response>][] = [
  ["GET availability", () => getAvailability()],
  [
    "PUT availability",
    () => putAvailability(request("/x", "PUT", editorHours)),
  ],
  ["GET profile", () => getProfile()],
  [
    "PUT profile",
    () =>
      putProfile(
        request("/x", "PUT", {
          listed: true,
          defaultPlace: null,
          onlineLink: null,
          contactEmail: null,
        }),
      ),
  ],
  ["GET inbox", () => getInbox()],
  [
    "POST decision",
    () =>
      postDecision(
        request("/x", "POST", { action: OfficeHoursRequestAction.Decline }),
        withId("r-1"),
      ),
  ],
  ["GET meetings", () => getMeetings()],
  ["GET academicians", () => getAcademicians()],
  ["GET academician", () => getAcademician(request("/x"), withId("a-1"))],
  ["GET slots", () => getSlots(request("/x"), withId("a-1"))],
  [
    "POST request",
    () =>
      postRequest(
        request("/x", "POST", {
          academicianId: ACADEMICIAN,
          startsAt: "2026-11-24T14:00:00+03:00",
          title: "Staj",
        }),
      ),
  ],
  ["GET appointments", () => getAppointments()],
  [
    "POST alternative",
    () =>
      postAlternative(request("/x", "POST", { accept: false }), withId("r-1")),
  ],
];

describe("office hours (Menton account) proxy routes", () => {
  it.each(handlers)("%s needs a session", async (_name, call) => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    expect((await call()).status).toBe(401);
    for (const value of Object.values(officeHours)) {
      expect(value).not.toHaveBeenCalled();
    }
  });

  it.each(handlers)(
    "%s answers with what the backend said",
    async (_name, call) => {
      expect((await call()).status).toBe(200);
    },
  );

  it("hands the availability editor the mentor shape both ways", async () => {
    vi.mocked(officeHours.fetchMyOfficeHoursAvailability).mockResolvedValue(
      backendResponse(backendHours),
    );
    const read = await getAvailability();
    expect(await read.json()).toEqual({
      rules: backendHours.rules,
      exceptions: [],
      menteeCapacity: 4,
      defaultMeetingDurationMinutes: 30,
      meetingBufferMinutes: 0,
    });

    await putAvailability(request("/x", "PUT", editorHours));
    expect(officeHours.saveMyOfficeHoursAvailability).toHaveBeenCalledWith(
      "user-1",
      {
        rules: editorHours.rules,
        exceptions: [],
        studentCapacity: 4,
        defaultMeetingDurationMinutes: 30,
        meetingBufferMinutes: 0,
      },
    );
  });

  it("passes a refusal from the backend through as it is", async () => {
    vi.mocked(officeHours.fetchMyOfficeHoursAvailability).mockResolvedValue(
      backendRefusal(404, { message: "Office hours not found." }),
    );
    expect((await getAvailability()).status).toBe(404);
  });

  it("acts as the session user, whatever actor the body names", async () => {
    await postRequest(
      request("/x", "POST", {
        actorId: "someone-else",
        academicianId: ACADEMICIAN,
        startsAt: "2026-11-24T14:00:00+03:00",
        title: "  Staj  ",
      }),
    );
    expect(officeHours.createOfficeHoursRequest).toHaveBeenCalledWith(
      "user-1",
      {
        academicianId: ACADEMICIAN,
        startsAt: "2026-11-24T14:00:00+03:00",
        title: "Staj",
        description: null,
      },
    );

    await postDecision(
      request("/x", "POST", {
        actorId: "someone-else",
        action: OfficeHoursRequestAction.ProposeTimes,
        times: ["2026-11-25T10:00:00+03:00"],
        message: "Bu saat daha iyi",
      }),
      withId("r-1"),
    );
    expect(officeHours.answerOfficeHoursRequest).toHaveBeenCalledWith(
      "user-1",
      "r-1",
      {
        action: OfficeHoursRequestAction.ProposeTimes,
        times: ["2026-11-25T10:00:00+03:00"],
        message: "Bu saat daha iyi",
      },
    );
  });

  const profileBody = {
    listed: true,
    defaultPlace: "A-204",
    onlineLink: null,
    contactEmail: null,
  };
  const askBody = {
    academicianId: ACADEMICIAN,
    startsAt: "2026-11-24T14:00:00+03:00",
    title: "Staj",
    description: null,
  };

  it.each([
    [
      "the hours",
      () => putAvailability(request("/x", "PUT", withForgedActor(editorHours))),
      () => officeHours.saveMyOfficeHoursAvailability,
    ],
    [
      "the profile",
      () => putProfile(request("/x", "PUT", withForgedActor(profileBody))),
      () => officeHours.saveMyOfficeHoursProfile,
    ],
    [
      "an answer",
      () =>
        postDecision(
          request(
            "/x",
            "POST",
            withForgedActor({ action: OfficeHoursRequestAction.Decline }),
          ),
          withId("r-1"),
        ),
      () => officeHours.answerOfficeHoursRequest,
    ],
    [
      "a request",
      () => postRequest(request("/x", "POST", withForgedActor(askBody))),
      () => officeHours.createOfficeHoursRequest,
    ],
    [
      "an answer to other times",
      () =>
        postAlternative(
          request("/x", "POST", withForgedActor({ accept: false })),
          withId("r-1"),
        ),
      () => officeHours.answerOfficeHoursAlternative,
    ],
  ])(
    "sends %s as the session user, never the actor the body names",
    async (_name, call, backend) => {
      await call();
      const [actor, ...rest] = vi.mocked(backend()).mock.calls[0] ?? [];
      expect(actor).toBe("user-1");
      expect(JSON.stringify(rest)).not.toContain("someone-else");
    },
  );

  it("ignores an actor named in the query string", async () => {
    await getAcademician(
      request(
        `/api/office-hours/me/academicians/${ACADEMICIAN}?actorId=someone-else`,
      ),
      withId(ACADEMICIAN),
    );
    expect(officeHours.fetchListedAcademician).toHaveBeenCalledWith(
      "user-1",
      ACADEMICIAN,
    );
  });

  it.each([
    [
      "an unknown answer",
      () =>
        postDecision(request("/x", "POST", { action: "DELETE" }), withId("r")),
    ],
    [
      "more than three offered times",
      () =>
        postDecision(
          request("/x", "POST", {
            action: OfficeHoursRequestAction.ProposeTimes,
            times: [1, 2, 3, 4].map((day) => `2026-11-2${day}T10:00:00+03:00`),
          }),
          withId("r"),
        ),
    ],
    [
      "a time without an offset",
      () =>
        postRequest(
          request("/x", "POST", {
            academicianId: ACADEMICIAN,
            startsAt: "next tuesday",
            title: "Staj",
          }),
        ),
    ],
    [
      "a blank title",
      () =>
        postRequest(
          request("/x", "POST", {
            academicianId: ACADEMICIAN,
            startsAt: "2026-11-24T14:00:00+03:00",
            title: "   ",
          }),
        ),
    ],
    [
      "an answer to other times that is not yes or no",
      () =>
        postAlternative(request("/x", "POST", { accept: "yes" }), withId("r")),
    ],
    [
      "a profile without the listed switch",
      () => putProfile(request("/x", "PUT", { defaultPlace: "A-204" })),
    ],
    [
      "hours on a day that does not exist",
      () =>
        putAvailability(
          request("/x", "PUT", {
            ...editorHours,
            rules: [{ ...editorHours.rules[0], dayOfWeek: "FUNDAY" }],
          }),
        ),
    ],
    [
      "a description over 2000 characters",
      () =>
        postRequest(
          request("/x", "POST", { ...askBody, description: "x".repeat(2001) }),
        ),
    ],
    [
      "a title over 200 characters",
      () =>
        postRequest(
          request("/x", "POST", { ...askBody, title: "x".repeat(201) }),
        ),
    ],
    [
      "an academician id that is not an id",
      () =>
        postRequest(request("/x", "POST", { ...askBody, academicianId: ".." })),
    ],
    [
      "a contact e-mail that is not one",
      () =>
        putProfile(
          request("/x", "PUT", { ...profileBody, contactEmail: "elif" }),
        ),
    ],
    [
      "a clock time that does not exist",
      () =>
        putAvailability(
          request("/x", "PUT", {
            ...editorHours,
            rules: [{ ...editorHours.rules[0], startTime: "25:00" }],
          }),
        ),
    ],
    [
      "a five-minute slot",
      () =>
        putAvailability(
          request("/x", "PUT", {
            ...editorHours,
            rules: [{ ...editorHours.rules[0], slotMinutes: 5 }],
          }),
        ),
    ],
    ["malformed JSON", () => putProfile(request("/x", "PUT", "{listed"))],
  ])("refuses %s before reaching the backend", async (_name, call) => {
    expect((await call()).status).toBe(400);
    for (const value of Object.values(officeHours)) {
      expect(value).not.toHaveBeenCalled();
    }
  });

  it("answers 502 with its own message when the backend cannot be reached", async () => {
    vi.mocked(officeHours.fetchOfficeHoursInbox).mockRejectedValue(
      new Error("socket hang up"),
    );

    const response = await getInbox();

    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("socket");
  });
});
