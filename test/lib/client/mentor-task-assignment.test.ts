import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  assignMentorshipTask,
  getTaskAssignees,
} from "@/lib/client/mentor-task-assignment";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
beforeEach(() => vi.clearAllMocks());
describe("mentor task client", () => {
  it("encodes the request and returns the assignees and created task", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: [{ id: "member" }],
    });
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 201,
      data: { id: "task" },
    });
    expect(await getTaskAssignees("request/1")).toEqual([{ id: "member" }]);
    expect(backendHttp.get).toHaveBeenCalledWith(
      "/api/mentorship-requests/request%2F1/task-assignees",
    );
    const input = { ownerId: "member", title: "Interview users" };
    expect(await assignMentorshipTask("request/1", input)).toEqual({
      id: "task",
    });
    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/mentorship-requests/request%2F1/tasks",
      input,
    );
  });
  it("propagates backend rejection as a client error", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 403,
      data: {},
      headers: {},
    });
    await expect(
      assignMentorshipTask("request", { ownerId: "member", title: "Task" }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
