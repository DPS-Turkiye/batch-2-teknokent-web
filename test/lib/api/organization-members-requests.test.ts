import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchOrganizationMembers,
  fetchPendingMembers,
  removeOrganizationMember,
  removePendingMember,
  updateOrganizationMember,
} from "@/lib/api/organization-members";
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
    "lists an encoded startup's members",
    () => fetchOrganizationMembers("org/1"),
    { method: "GET", url: "/api/organizations/org%2F1/members" },
  ],
  [
    "updates an encoded member with the actor added to the body",
    () =>
      updateOrganizationMember("org/1", "member 2", "founder-1", {
        jobTitle: "CTO",
      }),
    {
      method: "PATCH",
      url: "/api/organizations/org%2F1/members/member%202",
      data: { jobTitle: "CTO", actorId: "founder-1" },
    },
  ],
  [
    "lets the session's actor win over one sent in the update payload",
    () =>
      updateOrganizationMember("org/1", "member 2", "founder-1", {
        actorId: "someone-else",
      }),
    {
      method: "PATCH",
      url: "/api/organizations/org%2F1/members/member%202",
      data: { actorId: "founder-1" },
    },
  ],
  [
    "removes an encoded member",
    () => removeOrganizationMember("org/1", "member 2", "founder-1"),
    {
      method: "DELETE",
      url: "/api/organizations/org%2F1/members/member%202",
      params: { actorId: "founder-1" },
    },
  ],
  [
    "lists members still waiting to sign up",
    () => fetchPendingMembers("org/1", "founder-1"),
    {
      method: "GET",
      url: "/api/organizations/org%2F1/pending-members",
      params: { actorId: "founder-1" },
    },
  ],
  [
    "removes an encoded pending member",
    () => removePendingMember("org/1", "pend 1", "founder-1"),
    {
      method: "DELETE",
      url: "/api/organizations/org%2F1/pending-members/pend%201",
      params: { actorId: "founder-1" },
    },
  ],
];

describe("organization members server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
