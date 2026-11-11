import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/api/office-hours/availability/route";
import { Weekday } from "@/interfaces/mentor";
import {
  fetchOfficeHoursAvailability,
  saveOfficeHoursAvailability,
} from "@/lib/api/lti";
import { requireOfficeHoursUser } from "@/lib/server/office-hours-session";
import { SessionRequiredError } from "@/lib/server/session-error";
import { backendRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/lti", () => ({
  fetchOfficeHoursAvailability: vi.fn(),
  saveOfficeHoursAvailability: vi.fn(),
}));
vi.mock("@/lib/server/office-hours-session", () => ({
  requireOfficeHoursUser: vi.fn(),
}));

const backendSettings = {
  rules: [
    {
      id: "r1",
      dayOfWeek: Weekday.Tuesday,
      startTime: "14:00:00",
      endTime: "16:00:00",
      slotMinutes: 30,
    },
  ],
  exceptions: [],
  studentCapacity: 4,
  defaultMeetingDurationMinutes: 45,
  meetingBufferMinutes: 15,
};

describe("office-hours availability route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOfficeHoursUser).mockResolvedValue({
      userId: "user-1",
      fullName: "Ali Kaya",
    });
  });

  it("hands the editor the academic's hours with the capacity under its mentor name", async () => {
    vi.mocked(fetchOfficeHoursAvailability).mockResolvedValue({
      status: 200,
      headers: {},
      data: backendSettings,
    });

    const body = await (await GET()).json();

    expect(fetchOfficeHoursAvailability).toHaveBeenCalledWith("user-1");
    expect(body.menteeCapacity).toBe(4);
    expect(body).not.toHaveProperty("studentCapacity");
    expect(body.rules[0].slotMinutes).toBe(30);
  });

  it("saves the editor's payload with the capacity under the backend's name", async () => {
    vi.mocked(saveOfficeHoursAvailability).mockResolvedValue({
      status: 200,
      headers: {},
      data: backendSettings,
    });

    await PUT(
      new NextRequest("http://localhost", {
        method: "PUT",
        body: JSON.stringify({
          rules: [],
          exceptions: [],
          menteeCapacity: 4,
          defaultMeetingDurationMinutes: 45,
          meetingBufferMinutes: 15,
        }),
      }),
    );

    expect(saveOfficeHoursAvailability).toHaveBeenCalledWith("user-1", {
      rules: [],
      exceptions: [],
      studentCapacity: 4,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    });
  });

  it("passes the backend's refusal on, such as a student trying to edit", async () => {
    vi.mocked(fetchOfficeHoursAvailability).mockResolvedValue(
      backendRefusal(403, { message: "Only academics set office hours." }),
    );

    expect((await GET()).status).toBe(403);
  });

  it("needs an office-hours session", async () => {
    vi.mocked(requireOfficeHoursUser).mockRejectedValue(
      new SessionRequiredError(),
    );

    expect((await GET()).status).toBe(401);
    expect(fetchOfficeHoursAvailability).not.toHaveBeenCalled();
  });
});
