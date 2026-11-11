import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchActionItems,
  fetchActionItemsForRequests,
  fetchOrganizationActionItems,
  updateActionItem,
} from "@/lib/api/action-items";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists one request's action items for the startup asking",
    () => fetchActionItems("req-1", { organizationId: "org-1" }),
    {
      method: "GET",
      url: "/api/actions",
      params: { mentorshipRequestId: "req-1", organizationId: "org-1" },
    },
  ],
  [
    "lists one request's action items for the mentor asking",
    () => fetchActionItems("req-1", { mentorId: "mentor-1" }),
    {
      method: "GET",
      url: "/api/actions",
      params: { mentorshipRequestId: "req-1", mentorId: "mentor-1" },
    },
  ],
  [
    "lists several requests' action items with the ids joined by commas",
    () =>
      fetchActionItemsForRequests(["req-1", "req-2"], { mentorId: "mentor-1" }),
    {
      method: "GET",
      url: "/api/actions",
      params: { mentorshipRequestIds: "req-1,req-2", mentorId: "mentor-1" },
    },
  ],
  [
    "updates an encoded action item for the startup",
    () => updateActionItem("act/1", "org-1", { done: true }),
    {
      method: "PATCH",
      url: "/api/actions/act%2F1",
      params: { organizationId: "org-1" },
      data: { done: true },
    },
  ],
  [
    "lists every action item of the startup",
    () => fetchOrganizationActionItems("org-1"),
    { method: "GET", url: "/api/actions", params: { organizationId: "org-1" } },
  ],
];

describe("action items server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
