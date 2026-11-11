import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assignMentorshipTask,
  getTaskAssignees,
} from "@/lib/client/mentor-task-assignment";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
describe("mentor task client", () => {
  it("encodes the request and returns the assignees and created task", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      status: 200,
      data: [{ id: "member" }],
    });
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: { id: "task" },
    });
    expect(await getTaskAssignees("request/1")).toEqual([{ id: "member" }]);
    expect(httpClient.get).toHaveBeenCalledWith(
      "/api/mentor-requests/request%2F1/task-assignees",
    );
    const input = { ownerId: "member", title: "Interview users" };
    expect(await assignMentorshipTask("request/1", input)).toEqual({
      id: "task",
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/mentor-requests/request%2F1/tasks",
      input,
    );
  });
  it("propagates backend rejection as a client error", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 403,
      data: {},
      headers: {},
    });
    await expect(
      assignMentorshipTask("request", { ownerId: "member", title: "Task" }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
