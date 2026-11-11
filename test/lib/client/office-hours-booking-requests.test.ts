import { beforeEach, describe, vi } from "vitest";

import { OfficeHoursRequestStatus } from "@/interfaces/office-hours";
import {
  actOnOfficeHoursRequest,
  createOfficeHoursRequest,
  getCourseInstructors,
  getInstructorSlots,
  getOfficeHoursMeetings,
  getOfficeHoursRequests,
} from "@/lib/client/office-hours-booking";
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

const COURSE = "/api/office-hours/courses/c%2F1";
const booking = {
  instructorId: "i-1",
  topic: "Ödev 3",
  preferredSlots: ["2026-05-01T10:00:00Z"],
};
const decision = {
  status: OfficeHoursRequestStatus.Accepted,
  slot: "2026-05-01T10:00:00Z",
} as const;

const calls: ClientCall[] = [
  {
    title: "getCourseInstructors lists the encoded course's instructors",
    call: () => getCourseInstructors("c/1"),
    method: "get",
    args: [`${COURSE}/instructors`],
  },
  {
    title: "getInstructorSlots lists the encoded instructor's slots",
    call: () => getInstructorSlots("c/1", "i/1"),
    method: "get",
    args: [`${COURSE}/instructors/i%2F1/slots`],
  },
  {
    title: "getOfficeHoursRequests lists the course's requests",
    call: () => getOfficeHoursRequests("c/1"),
    method: "get",
    args: [`${COURSE}/requests`],
  },
  {
    title: "getOfficeHoursMeetings lists the course's meetings",
    call: () => getOfficeHoursMeetings("c/1"),
    method: "get",
    args: [`${COURSE}/meetings`],
  },
  {
    title: "createOfficeHoursRequest posts the booking",
    call: () => createOfficeHoursRequest("c/1", booking),
    method: "post",
    args: [`${COURSE}/requests`, booking],
  },
  {
    title: "actOnOfficeHoursRequest posts a decision to the decision action",
    call: () =>
      actOnOfficeHoursRequest("c/1", "r/1", {
        kind: "decision",
        payload: decision,
      }),
    method: "post",
    args: [`${COURSE}/requests/r%2F1/decision`, decision],
  },
  {
    title: "actOnOfficeHoursRequest posts a reply to the reply action",
    call: () =>
      actOnOfficeHoursRequest("c/1", "r/1", {
        kind: "reply",
        payload: { message: "Tamam" },
      }),
    method: "post",
    args: [`${COURSE}/requests/r%2F1/reply`, { message: "Tamam" }],
  },
  {
    title: "actOnOfficeHoursRequest sends an empty body for a withdrawal",
    call: () => actOnOfficeHoursRequest("c/1", "r/1", { kind: "withdraw" }),
    method: "post",
    args: [`${COURSE}/requests/r%2F1/withdraw`, {}],
  },
];

describe("office hours booking client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
