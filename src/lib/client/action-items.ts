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

export async function changeActionItemStatus(input: {
  id: string;
  status: ActionItemStatus;
}) {
  const { id, ...body } = input;
  return requireSuccess(
    await httpClient.patch<ActionItem>(`/api/action-items/${id}`, body),
  );
}

export async function getOrganizationActionItems() {
  return requireSuccess(
    await httpClient.get<ActionItem[]>("/api/action-items", {
      params: { scope: "organization" },
    }),
  );
}
