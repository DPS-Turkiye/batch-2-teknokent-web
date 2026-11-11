import { beforeEach, describe, vi } from "vitest";

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

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const member = { fullName: "Can Er", email: "can@acme.test" };

const calls: ClientCall[] = [
  {
    title: "getOrganizationMembers lists the user's own team",
    call: () => getOrganizationMembers(),
    method: "get",
    args: ["/api/organization-members"],
  },
  {
    title: "getOrganizationMembersById lists the encoded organization's team",
    call: () => getOrganizationMembersById("org/1"),
    method: "get",
    args: ["/api/organizations/org%2F1/members"],
  },
  {
    title: "addOrganizationMember posts the new member",
    call: () => addOrganizationMember(member),
    method: "post",
    args: ["/api/organization-members", member],
  },
  {
    title: "getPendingMembers lists teammates who have not joined yet",
    call: () => getPendingMembers(),
    method: "get",
    args: ["/api/organization-members/pending"],
  },
  {
    title: "removePendingMember deletes the encoded pending teammate",
    call: () => removePendingMember("p/1"),
    method: "delete",
    args: ["/api/organization-members/pending/p%2F1"],
    returnsNothing: true,
  },
];

describe("organization members client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
