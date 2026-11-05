import type { ActionItem } from "@/interfaces/action-item";
import type {
  AssignMentorshipTaskInput,
  TaskAssignee,
} from "@/interfaces/mentor-task-assignment";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

function requestUrl(requestId: string) {
  return `/api/mentor-requests/${encodeURIComponent(requestId)}`;
}

export async function getTaskAssignees(requestId: string) {
  return requireSuccess(
    await httpClient.get<TaskAssignee[]>(
      `${requestUrl(requestId)}/task-assignees`,
    ),
  );
}

export async function assignMentorshipTask(
  requestId: string,
  input: AssignMentorshipTaskInput,
) {
  return requireSuccess(
    await httpClient.post<ActionItem>(`${requestUrl(requestId)}/tasks`, input),
  );
}
