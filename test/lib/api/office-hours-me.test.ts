import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import { Weekday } from "@/interfaces/mentor";
import {
  answerOfficeHoursAlternative,
  answerOfficeHoursRequest,
  createOfficeHoursRequest,
  fetchAcademicianOfficeHoursMeetings,
  fetchAcademicianOpenSlots,
  fetchListedAcademician,
  fetchListedAcademicians,
  fetchMyOfficeHoursAvailability,
  fetchMyOfficeHoursProfile,
  fetchMyOfficeHoursRequests,
  fetchOfficeHoursInbox,
  saveMyOfficeHoursAvailability,
  saveMyOfficeHoursProfile,
} from "@/lib/api/office-hours-me";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

const ME = "/api/office-hours/me";
const actor = { actorId: "user-1" };
const hours = {
  rules: [
    {
      dayOfWeek: Weekday.Tuesday,
      startTime: "10:00",
      endTime: "12:00",
      slotMinutes: 30,
    },
  ],
  exceptions: [],
  studentCapacity: null,
  defaultMeetingDurationMinutes: 30,
  meetingBufferMinutes: 0,
};
const profile = {
  listed: true,
  defaultPlace: "A-204",
  onlineLink: null,
  contactEmail: null,
};
const ask = {
  academicianId: "academician-1",
  startsAt: "2026-11-24T14:00:00+03:00",
  title: "Staj",
  description: null,
};

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "reads the academician's hours",
    () => fetchMyOfficeHoursAvailability("user-1"),
    { method: "GET", url: `${ME}/availability`, params: actor },
  ],
  [
    "saves the academician's hours",
    () => saveMyOfficeHoursAvailability("user-1", hours),
    { method: "PUT", url: `${ME}/availability`, params: actor, data: hours },
  ],
  [
    "reads the academician's profile",
    () => fetchMyOfficeHoursProfile("user-1"),
    { method: "GET", url: `${ME}/profile`, params: actor },
  ],
  [
    "saves the academician's profile",
    () => saveMyOfficeHoursProfile("user-1", profile),
    { method: "PUT", url: `${ME}/profile`, params: actor, data: profile },
  ],
  [
    "reads the academician's inbox",
    () => fetchOfficeHoursInbox("user-1"),
    { method: "GET", url: `${ME}/inbox`, params: actor },
  ],
  [
    "answers a request, escaping its id",
    () =>
      answerOfficeHoursRequest("user-1", "request/1", {
        action: OfficeHoursRequestAction.Decline,
        message: "Bu hafta dolu",
      }),
    {
      method: "POST",
      url: `${ME}/requests/request%2F1/decision`,
      params: actor,
      data: {
        action: OfficeHoursRequestAction.Decline,
        message: "Bu hafta dolu",
      },
    },
  ],
  [
    "reads the academician's meetings",
    () => fetchAcademicianOfficeHoursMeetings("user-1"),
    { method: "GET", url: `${ME}/meetings`, params: actor },
  ],
  [
    "lists the academicians a student may ask",
    () => fetchListedAcademicians("user-1"),
    { method: "GET", url: `${ME}/academicians`, params: actor },
  ],
  [
    "reads one listed academician",
    () => fetchListedAcademician("user-1", "academician-1"),
    { method: "GET", url: `${ME}/academicians/academician-1`, params: actor },
  ],
  [
    "reads an academician's open slots",
    () => fetchAcademicianOpenSlots("user-1", "academician-1"),
    {
      method: "GET",
      url: `${ME}/academicians/academician-1/slots`,
      params: actor,
    },
  ],
  [
    "sends a student's request",
    () => createOfficeHoursRequest("user-1", ask),
    { method: "POST", url: `${ME}/requests`, params: actor, data: ask },
  ],
  [
    "reads the student's own requests",
    () => fetchMyOfficeHoursRequests("user-1"),
    { method: "GET", url: `${ME}/appointments`, params: actor },
  ],
  [
    "answers the academician's other times",
    () =>
      answerOfficeHoursAlternative("user-1", "request-1", {
        accept: true,
        time: "2026-11-25T10:00:00+03:00",
      }),
    {
      method: "POST",
      url: `${ME}/requests/request-1/alternative`,
      params: actor,
      data: { accept: true, time: "2026-11-25T10:00:00+03:00" },
    },
  ],
];

describe("office hours (Menton account) server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
