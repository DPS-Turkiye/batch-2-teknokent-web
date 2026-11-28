import { beforeEach, describe, expect, it, vi } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import {
  changeActionItemStatus,
  getActionItems,
  getActionItemsForRequests,
  getOrganizationActionItems,
} from "@/lib/client/action-items";
import { backendHttp } from "@/lib/client/backend-http";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "getActionItems reads one request's action items",
    call: () => getActionItems("req-1"),
    method: "get",
    args: ["/api/actions", { params: { mentorshipRequestId: "req-1" } }],
  },
  {
    title: "getActionItemsForRequests asks for every request in one call",
    call: () => getActionItemsForRequests(["req-1", "req-2"]),
    method: "get",
    args: ["/api/actions", { params: { mentorshipRequestIds: "req-1,req-2" } }],
  },
  {
    title: "changeActionItemStatus patches only the status, not the id",
    call: () =>
      changeActionItemStatus({
        id: "item-1",
        status: ActionItemStatus.Completed,
      }),
    method: "patch",
    args: ["/api/actions/item-1", { status: ActionItemStatus.Completed }],
  },
  {
    title:
      "getOrganizationActionItems reads the caller's own startup's items, naming none",
    call: () => getOrganizationActionItems(),
    method: "get",
    args: ["/api/actions"],
  },
];

describe("action items client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);

  it("asks for nothing when there are no requests", async () => {
    await expect(getActionItemsForRequests([])).resolves.toEqual([]);
    expect(backendHttp.get).not.toHaveBeenCalled();
  });
});
