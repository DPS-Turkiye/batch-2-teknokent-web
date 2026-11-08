import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET,
  POST,
} from "@/app/api/office-hours/courses/[courseId]/[...path]/route";
import { backendRequest } from "@/lib/server/backend-client";
import { requireOfficeHoursUser } from "@/lib/server/office-hours-session";
import { SessionRequiredError } from "@/lib/server/session-error";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));
vi.mock("@/lib/server/office-hours-session", () => ({
  requireOfficeHoursUser: vi.fn(),
}));

const REQUEST_ID = "3f1c2a8e-0b7d-4e55-9a1f-2c3d4e5f6a7b";
const BACKEND = "/api/office-hours/users/user-1/courses/course-1";

function params(path: string[]) {
  return { params: Promise.resolve({ courseId: "course-1", path }) };
}

function post(body: string) {
  return new NextRequest("http://localhost", { method: "POST", body });
}

describe("office-hours course route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireOfficeHoursUser).mockResolvedValue({
      userId: "user-1",
      fullName: "Ayşe Yılmaz",
    });
    vi.mocked(backendRequest).mockResolvedValue({
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
    expect(backendRequest).toHaveBeenCalledWith({
      method: "GET",
      url: `${BACKEND}/requests`,
      data: undefined,
    });
  });

  it("posts an action on a request with its body", async () => {
    await POST(
      post(JSON.stringify({ slot: "2026-11-12T10:30" })),
      params(["requests", REQUEST_ID, "accept-proposed"]),
    );

    expect(backendRequest).toHaveBeenCalledWith({
      method: "POST",
      url: `${BACKEND}/requests/${REQUEST_ID}/accept-proposed`,
      data: { slot: "2026-11-12T10:30" },
    });
  });

  it("answers a body that is not JSON with a 400", async () => {
    const response = await POST(
      post("{not json"),
      params(["requests", REQUEST_ID, "withdraw"]),
    );

    expect(response.status).toBe(400);
    expect(backendRequest).not.toHaveBeenCalled();
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
    expect(backendRequest).not.toHaveBeenCalled();
  });

  it("needs an office-hours session", async () => {
    vi.mocked(requireOfficeHoursUser).mockRejectedValue(
      new SessionRequiredError(),
    );

    const response = await GET(
      new NextRequest("http://localhost"),
      params(["requests"]),
    );

    expect(response.status).toBe(401);
    expect(backendRequest).not.toHaveBeenCalled();
  });
});
