import { describe, vi } from "vitest";

import { OfficeHoursRequestAction } from "@/interfaces/academician-office-hours";
import { Weekday } from "@/interfaces/mentor";
import {
  answerOfficeHoursAlternative,
  answerOfficeHoursRequest,
  getAcademicianOfficeHoursMeetings,
  getAcademicianOpenSlots,
  getListedAcademician,
  getListedAcademicians,
  getMyOfficeHoursAvailability,
  getMyOfficeHoursProfile,
  getMyOfficeHoursRequests,
  getOfficeHoursInbox,
  saveMyOfficeHoursAvailability,
  saveMyOfficeHoursProfile,
  sendOfficeHoursRequest,
} from "@/lib/client/office-hours-me";
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

const ME = "/api/office-hours/me";
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
  menteeCapacity: 4,
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

const calls: ClientCall[] = [
  {
    title: "getMyOfficeHoursAvailability reads the academician's hours",
    call: () => getMyOfficeHoursAvailability(),
    method: "get",
    args: [`${ME}/availability`],
  },
  {
    title: "saveMyOfficeHoursAvailability saves them in the editor's shape",
    call: () => saveMyOfficeHoursAvailability(hours),
    method: "put",
    args: [`${ME}/availability`, hours],
  },
  {
    title: "getMyOfficeHoursProfile reads the profile",
    call: () => getMyOfficeHoursProfile(),
    method: "get",
    args: [`${ME}/profile`],
  },
  {
    title: "saveMyOfficeHoursProfile saves it",
    call: () => saveMyOfficeHoursProfile(profile),
    method: "put",
    args: [`${ME}/profile`, profile],
  },
  {
    title: "getOfficeHoursInbox reads the requests sent to the academician",
    call: () => getOfficeHoursInbox(),
    method: "get",
    args: [`${ME}/inbox`],
  },
  {
    title: "answerOfficeHoursRequest answers one, escaping its id",
    call: () =>
      answerOfficeHoursRequest("request/1", {
        action: OfficeHoursRequestAction.Accept,
        time: "2026-11-24T14:00:00+03:00",
      }),
    method: "post",
    args: [
      `${ME}/requests/request%2F1/decision`,
      {
        action: OfficeHoursRequestAction.Accept,
        time: "2026-11-24T14:00:00+03:00",
      },
    ],
  },
  {
    title: "getAcademicianOfficeHoursMeetings reads the academician's meetings",
    call: () => getAcademicianOfficeHoursMeetings(),
    method: "get",
    args: [`${ME}/meetings`],
  },
  {
    title: "getListedAcademicians lists who a student may ask",
    call: () => getListedAcademicians(),
    method: "get",
    args: [`${ME}/academicians`],
  },
  {
    title: "getListedAcademician reads one of them",
    call: () => getListedAcademician("academician-1"),
    method: "get",
    args: [`${ME}/academicians/academician-1`],
  },
  {
    title: "getAcademicianOpenSlots reads their open times",
    call: () => getAcademicianOpenSlots("academician-1"),
    method: "get",
    args: [`${ME}/academicians/academician-1/slots`],
  },
  {
    title: "sendOfficeHoursRequest sends a student's request",
    call: () => sendOfficeHoursRequest(ask),
    method: "post",
    args: [`${ME}/requests`, ask],
  },
  {
    title: "getMyOfficeHoursRequests reads the student's own requests",
    call: () => getMyOfficeHoursRequests(),
    method: "get",
    args: [`${ME}/appointments`],
  },
  {
    title: "answerOfficeHoursAlternative takes an offered time or withdraws",
    call: () => answerOfficeHoursAlternative("request-1", { accept: false }),
    method: "post",
    args: [`${ME}/requests/request-1/alternative`, { accept: false }],
  },
];

describe("office hours (Menton account) client", () => {
  itSendsEachClientCall(calls);
});
