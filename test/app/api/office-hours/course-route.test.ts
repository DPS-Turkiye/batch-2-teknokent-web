import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET,
  POST,
} from "@/app/api/office-hours/courses/[courseId]/[...path]/route";
import { officeHoursCourseRequest } from "@/lib/api/lti";
import { getOfficeHoursUser } from "@/lib/server/office-hours-session";

vi.mock("@/lib/api/lti", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/lti")>();
  return { ...actual, officeHoursCourseRequest: vi.fn() };
});
vi.mock("@/lib/server/office-hours-session", () => ({
  getOfficeHoursUser: vi.fn(),
}));

const REQUEST_ID = "3f1c2a8e-0b7d-4e55-9a1f-2c3d4e5f6a7b";

function params(path: string[]) {
  return { params: Promise.resolve({ courseId: "course-1", path }) };
}

describe("office-hours course route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOfficeHoursUser).mockResolvedValue({
      userId: "user-1",
      fullName: "Ayşe Yılmaz",
    });
    vi.mocked(officeHoursCourseRequest).mockResolvedValue({
      status: 200,
      headers: {},
      data: [],
    });
  });

  it("reads the course's requests for the signed-in person", async () => {
    const response = await GET(
      new NextRequest("http://localhost"),
      params(["requests"]),
    );

    expect(response.status).toBe(200);
    expect(officeHoursCourseRequest).toHaveBeenCalledWith(
      "user-1",
      "course-1",
      "requests",
      "GET",
      undefined,
    );
  });

  it("posts an action on a request with its body", async () => {
    await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ slot: "2026-11-12T10:30" }),
      }),
      params(["requests", REQUEST_ID, "accept-proposed"]),
    );

    expect(officeHoursCourseRequest).toHaveBeenCalledWith(
      "user-1",
      "course-1",
      `requests/${REQUEST_ID}/accept-proposed`,
      "POST",
      { slot: "2026-11-12T10:30" },
    );
  });

  it.each([
    ["availability"],
    ["requests", "not-an-id", "decision"],
    ["..", "..", "admin"],
  ])("refuses paths outside office-hours booking (%s)", async (...path) => {
    const response = await GET(
      new NextRequest("http://localhost"),
      params(path),
    );

    expect(response.status).toBe(404);
    expect(officeHoursCourseRequest).not.toHaveBeenCalled();
  });

  it("needs an office-hours session", async () => {
    vi.mocked(getOfficeHoursUser).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost"),
      params(["requests"]),
    );

    expect(response.status).toBe(401);
    expect(officeHoursCourseRequest).not.toHaveBeenCalled();
  });
});
