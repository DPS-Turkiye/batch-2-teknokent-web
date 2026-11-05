import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/mentor-requests/[id]/task-assignees/route";
import { POST } from "@/app/api/mentor-requests/[id]/tasks/route";
import { type AppSession, UserRole } from "@/interfaces/session";
import {
  assignMentorshipTask,
  fetchTaskAssignees,
} from "@/lib/api/mentor-task-assignment";
import { HttpMethod } from "@/lib/http-method";
import { getSessionUser } from "@/lib/session";

vi.mock("@/lib/api/mentor-task-assignment", () => ({
  assignMentorshipTask: vi.fn(),
  fetchTaskAssignees: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
const context = { params: Promise.resolve({ id: "request-1" }) };
const ownerId = "00000000-0000-4000-8000-000000000001";
const input = { ownerId, title: "Interview users" };
const ok = { status: 201, data: { id: "task-1" }, headers: {} };
function session(role = UserRole.Mentor): AppSession {
  return {
    userId: "mentor-1",
    email: "mentor@test.com",
    fullName: "Mentor",
    jobTitle: "",
    role,
  };
}
function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/mentor-requests/request-1/tasks", {
      method: HttpMethod.Post,
      body: JSON.stringify(body),
    }),
    context,
  );
}
function get() {
  return GET(
    new NextRequest(
      "http://localhost/api/mentor-requests/request-1/task-assignees?actorId=spoof",
    ),
    context,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(session());
  vi.mocked(assignMentorshipTask).mockResolvedValue(ok);
  vi.mocked(fetchTaskAssignees).mockResolvedValue({
    status: 200,
    data: [{ id: ownerId, fullName: "Member" }],
    headers: {},
  });
});
describe("mentor task routes", () => {
  it("derives identity from the session and scope from the URL", async () => {
    const response = await post({
      ...input,
      title: " Interview users ",
      actorId: "spoof",
      organizationId: "spoof",
      mentorshipRequestId: "spoof",
    });
    expect(response.status).toBe(201);
    expect(assignMentorshipTask).toHaveBeenCalledWith(
      "request-1",
      "mentor-1",
      input,
    );
    expect((await get()).status).toBe(200);
    expect(fetchTaskAssignees).toHaveBeenCalledWith("request-1", "mentor-1");
  });
  it("requires a session for both endpoints", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    expect((await post(input)).status).toBe(401);
    expect((await get()).status).toBe(401);
    expect(assignMentorshipTask).not.toHaveBeenCalled();
    expect(fetchTaskAssignees).not.toHaveBeenCalled();
  });
  it.each([UserRole.Mentee, UserRole.Admin, UserRole.Coordinator])(
    "refuses %s before contacting the backend",
    async (role) => {
      vi.mocked(getSessionUser).mockResolvedValue(session(role));
      expect((await post(input)).status).toBe(403);
      expect((await get()).status).toBe(403);
      expect(assignMentorshipTask).not.toHaveBeenCalled();
      expect(fetchTaskAssignees).not.toHaveBeenCalled();
    },
  );
  it.each([
    { ownerId, title: " " },
    { title: "Task" },
    { ...input, dueDate: "2026-02-30" },
  ])("refuses invalid input %o", async (body) => {
    expect((await post(body)).status).toBe(400);
    expect(assignMentorshipTask).not.toHaveBeenCalled();
  });
  it("returns a validation error for malformed JSON", async () => {
    const response = await POST(
      new NextRequest("http://localhost/tasks", {
        method: HttpMethod.Post,
        body: "{",
      }),
      context,
    );
    expect(response.status).toBe(400);
    expect(assignMentorshipTask).not.toHaveBeenCalled();
  });
  it("preserves the backend's ownership refusal and error status", async () => {
    vi.mocked(assignMentorshipTask).mockResolvedValue({
      ...ok,
      status: 403,
      data: { id: "", message: "Forbidden" },
    });
    expect((await post(input)).status).toBe(403);
    vi.mocked(fetchTaskAssignees).mockResolvedValue({ ...ok, status: 404 });
    expect((await get()).status).toBe(404);
  });
});
