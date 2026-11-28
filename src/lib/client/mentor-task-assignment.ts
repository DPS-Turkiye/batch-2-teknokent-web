import type { ActionItem } from "@/interfaces/action-item";
import type {
  AssignMentorshipTaskInput,
  TaskAssignee,
} from "@/interfaces/mentor-task-assignment";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

function requestUrl(requestId: string) {
  return `/api/mentorship-requests/${encodeURIComponent(requestId)}`;
}

export async function getTaskAssignees(requestId: string) {
  return requireSuccess(
    await backendHttp.get<TaskAssignee[]>(
      `${requestUrl(requestId)}/task-assignees`,
    ),
  );
}

export async function assignMentorshipTask(
  requestId: string,
  input: AssignMentorshipTaskInput,
) {
  return requireSuccess(
    await backendHttp.post<ActionItem>(`${requestUrl(requestId)}/tasks`, input),
  );
}
