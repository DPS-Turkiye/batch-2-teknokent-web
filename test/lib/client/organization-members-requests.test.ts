import { beforeEach, describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  addOrganizationMember,
  getOrganizationMembers,
  getOrganizationMembersById,
  getPendingMembers,
  removePendingMember,
} from "@/lib/client/organization-members";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);

const member = { fullName: "Can Er", email: "can@acme.test" };

const calls: ClientCall[] = [
  {
    title: "getOrganizationMembers lists the user's own team",
    call: () => getOrganizationMembers(),
    method: "get",
    args: ["/api/organizations/org%2F1/members"],
  },
  {
    title: "getOrganizationMembersById lists the encoded organization's team",
    call: () => getOrganizationMembersById("org/2"),
    method: "get",
    args: ["/api/organizations/org%2F2/members"],
  },
  {
    title: "addOrganizationMember posts the new member",
    call: () => addOrganizationMember(member),
    method: "post",
    args: ["/api/organizations/org%2F1/members", member],
  },
  {
    title: "getPendingMembers lists teammates who have not joined yet",
    call: () => getPendingMembers(),
    method: "get",
    args: ["/api/organizations/org%2F1/pending-members"],
  },
  {
    title: "removePendingMember deletes the encoded pending teammate",
    call: () => removePendingMember("p/1"),
    method: "delete",
    args: ["/api/organizations/org%2F1/pending-members/p%2F1"],
    returnsNothing: true,
  },
];

describe("organization members client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);
});
