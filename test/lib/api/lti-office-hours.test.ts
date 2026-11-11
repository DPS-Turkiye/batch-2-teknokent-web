import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchOfficeHoursAvailability,
  fetchOfficeHoursCourse,
  OFFICE_HOURS_COURSE_PATHS,
  officeHoursCourseUrl,
  saveOfficeHoursAvailability,
} from "@/lib/api/lti";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "reads an encoded user's course",
    () => fetchOfficeHoursCourse("user/1", "course 1"),
    {
      method: "GET",
      url: "/api/office-hours/users/user%2F1/courses/course%201",
    },
  ],
  [
    "reads an encoded user's office-hours availability",
    () => fetchOfficeHoursAvailability("user/1"),
    { method: "GET", url: "/api/office-hours/users/user%2F1/availability" },
  ],
  [
    "saves the availability with the payload as the body",
    () =>
      saveOfficeHoursAvailability("user/1", {
        rules: [],
        exceptions: [],
        studentCapacity: null,
        defaultMeetingDurationMinutes: 20,
        meetingBufferMinutes: 5,
      }),
    {
      method: "PUT",
      url: "/api/office-hours/users/user%2F1/availability",
      data: {
        rules: [],
        exceptions: [],
        studentCapacity: null,
        defaultMeetingDurationMinutes: 20,
        meetingBufferMinutes: 5,
      },
    },
  ],
];

describe("LTI office hours server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });

  describe("office-hours course paths", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const allowed = (path: string) =>
      OFFICE_HOURS_COURSE_PATHS.some((pattern) => pattern.test(path));

    it.each([
      "instructors",
      `instructors/${uuid}/slots`,
      "requests",
      `requests/${uuid}/decision`,
      `requests/${uuid}/reply`,
      `requests/${uuid}/accept-proposed`,
      `requests/${uuid}/withdraw`,
      "meetings",
    ])("lets the proxy forward %s", (path) => {
      expect(allowed(path)).toBe(true);
    });

    it.each([
      "instructors/",
      "instructors/not-a-uuid/slots",
      `requests/${uuid}/delete`,
      `requests/${uuid}/decision/extra`,
      `../${uuid}`,
      "meetings?x=1",
    ])("refuses to forward %s", (path) => {
      expect(allowed(path)).toBe(false);
    });

    it("builds the backend URL under the encoded user and course", () => {
      expect(
        officeHoursCourseUrl("user/1", { courseId: "course 1" }, "requests"),
      ).toBe("/api/office-hours/users/user%2F1/courses/course%201/requests");
    });
  });
});
