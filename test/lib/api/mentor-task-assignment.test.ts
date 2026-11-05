import { describe, expect, it, vi } from "vitest";
import {
  assignMentorshipTask,
  fetchTaskAssignees,
} from "@/lib/api/mentor-task-assignment";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";
vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));
describe("mentor task server wrapper", () => {
  it("passes the session actor separately from the fixed task body", async () => {
    const input = { ownerId: "member", title: "Task" };
    await assignMentorshipTask("request/1", "mentor", input);
    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Post,
      url: "/api/mentorship-requests/request%2F1/tasks",
      params: { actorId: "mentor" },
      data: input,
    });
    await fetchTaskAssignees("request/1", "mentor");
    expect(backendRequest).toHaveBeenLastCalledWith({
      method: HttpMethod.Get,
      url: "/api/mentorship-requests/request%2F1/task-assignees",
      params: { actorId: "mentor" },
    });
  });
});
