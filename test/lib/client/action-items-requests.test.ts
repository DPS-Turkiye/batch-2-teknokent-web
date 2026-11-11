import { beforeEach, describe, vi } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import {
  changeActionItemStatus,
  getActionItems,
  getActionItemsForRequests,
  getOrganizationActionItems,
} from "@/lib/client/action-items";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const calls: ClientCall[] = [
  {
    title: "getActionItems reads one request's action items",
    call: () => getActionItems("req-1"),
    method: "get",
    args: ["/api/action-items", { params: { requestId: "req-1" } }],
  },
  {
    title: "getActionItemsForRequests asks for every request in one call",
    call: () => getActionItemsForRequests(["req-1", "req-2"]),
    method: "get",
    args: ["/api/action-items", { params: { requestIds: "req-1,req-2" } }],
  },
  {
    title: "changeActionItemStatus patches only the status, not the id",
    call: () =>
      changeActionItemStatus({
        id: "item-1",
        status: ActionItemStatus.Completed,
      }),
    method: "patch",
    args: ["/api/action-items/item-1", { status: ActionItemStatus.Completed }],
  },
  {
    title: "getOrganizationActionItems reads the whole startup's action items",
    call: () => getOrganizationActionItems(),
    method: "get",
    args: ["/api/action-items", { params: { scope: "organization" } }],
  },
];

describe("action items client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
