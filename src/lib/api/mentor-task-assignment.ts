import "server-only";

import type { AssignMentorshipTaskInput } from "@/interfaces/mentor-task-assignment";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

function requestUrl(requestId: string) {
  return `/api/mentorship-requests/${encodeURIComponent(requestId)}`;
}

export function fetchTaskAssignees(requestId: string, actorId: string) {
  return backendRequest({
    method: HttpMethod.Get,
    url: `${requestUrl(requestId)}/task-assignees`,
    params: { actorId },
  });
}

export function assignMentorshipTask(
  requestId: string,
  actorId: string,
  input: AssignMentorshipTaskInput,
) {
  return backendRequest({
    method: HttpMethod.Post,
    url: `${requestUrl(requestId)}/tasks`,
    params: { actorId },
    data: input,
  });
}
