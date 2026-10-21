import type { ActionItem, ActionItemStatus } from "@/interfaces/action-item";
import { requireSuccess } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";

export async function getActionItems(requestId: string) {
  return requireSuccess(
    await httpClient.get<ActionItem[]>("/api/action-items", {
      params: { requestId },
    }),
  );
}

/** Every listed request's action items in one call; each item says its request. */
export async function getActionItemsForRequests(requestIds: string[]) {
  return requireSuccess(
    await httpClient.get<ActionItem[]>("/api/action-items", {
      params: { requestIds: requestIds.join(",") },
    }),
  );
}

export async function addActionItem(input: {
  requestId: string;
  ownerId: string;
  title: string;
  description?: string;
  dueDate?: string;
  meetingId?: string;
}) {
  return requireSuccess(
    await httpClient.post<ActionItem>("/api/action-items", input),
  );
}

export async function changeActionItemStatus(input: {
  id: string;
  requestId: string;
  status: ActionItemStatus;
}) {
  const { id, ...body } = input;
  return requireSuccess(
    await httpClient.patch<ActionItem>(`/api/action-items/${id}`, body),
  );
}
