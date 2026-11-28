import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  getOfficeHoursAvailability,
  getOfficeHoursCourse,
  updateOfficeHoursAvailability,
} from "@/lib/client/office-hours";
import {
  officeHoursSession,
  officeHoursUserPath,
} from "@/lib/client/office-hours-session";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const settings = {
  rules: [],
  exceptions: [],
  menteeCapacity: null,
  defaultMeetingDurationMinutes: 45,
  meetingBufferMinutes: 15,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(backendHttp.get).mockImplementation((url: string) =>
    Promise.resolve(
      url === "/api/office-hours/session"
        ? { status: 200, data: { userId: "oh/1", fullName: "Ayşe Yılmaz" } }
        : { status: 200, data: settings },
    ),
  );
  vi.mocked(backendHttp.put).mockResolvedValue({ status: 200, data: settings });
});

describe("office hours of the person the LTI launch signed in", () => {
  it("names the session's own person in the path", async () => {
    expect(await officeHoursUserPath("availability")).toBe(
      "/api/office-hours/users/oh%2F1/availability",
    );
    expect((await officeHoursSession()).fullName).toBe("Ayşe Yılmaz");
  });

  it("reads and saves the academic's availability on the backend", async () => {
    await getOfficeHoursAvailability();
    await updateOfficeHoursAvailability(settings);

    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/office-hours/users/oh%2F1/availability",
    );
    expect(backendHttp.put).toHaveBeenCalledWith(
      "/api/office-hours/users/oh%2F1/availability",
      settings,
    );
  });

  it("reads a course as the person sees it", async () => {
    await getOfficeHoursCourse("c/1");

    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/office-hours/users/oh%2F1/courses/c%2F1",
    );
  });
});
