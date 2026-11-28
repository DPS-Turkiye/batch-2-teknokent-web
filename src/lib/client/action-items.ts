import type { ActionItem, ActionItemStatus } from "@/interfaces/action-item";
import { requireSuccess } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";

// The backend scopes every call to the caller: their own requests (as the mentor or the team, by their primary
// side) and their own startup's items.
const BASE = "/api/actions";

export async function getActionItems(requestId: string) {
  return requireSuccess(
    await backendHttp.get<ActionItem[]>(BASE, {
      params: { mentorshipRequestId: requestId },
    }),
  );
}

/** Every listed request's action items in one call; each item says its request. */
export async function getActionItemsForRequests(requestIds: string[]) {
  if (requestIds.length === 0) return [];
  return requireSuccess(
    await backendHttp.get<ActionItem[]>(BASE, {
      params: { mentorshipRequestIds: requestIds.join(",") },
    }),
  );
}

export async function changeActionItemStatus(input: {
  id: string;
  status: ActionItemStatus;
}) {
  const { id, ...body } = input;
  return requireSuccess(
    await backendHttp.patch<ActionItem>(
      `${BASE}/${encodeURIComponent(id)}`,
      body,
    ),
  );
}

export async function getOrganizationActionItems() {
  return requireSuccess(await backendHttp.get<ActionItem[]>(BASE));
}
