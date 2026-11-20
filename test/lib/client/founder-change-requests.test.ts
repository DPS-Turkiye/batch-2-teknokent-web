import { describe, vi } from "vitest";

import {
  changeFounder,
  getFounderChangeOptions,
} from "@/lib/client/founder-change";
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

vi.mock("@/lib/client/bearer", () => ({
  bearerHeader: vi.fn().mockResolvedValue({ Authorization: "Bearer token-1" }),
}));

const calls: ClientCall[] = [
  {
    title: "getFounderChangeOptions reads the encoded startup with the token",
    call: () => getFounderChangeOptions("org/1"),
    method: "get",
    args: [
      "/api/organizations/org%2F1/founder",
      { headers: { Authorization: "Bearer token-1" } },
    ],
  },
  {
    title: "changeFounder posts the new founder with the token",
    call: () => changeFounder("org-1", "member-1"),
    method: "post",
    args: [
      "/api/organizations/org-1/founder",
      { newFounderId: "member-1" },
      { headers: { Authorization: "Bearer token-1" } },
    ],
  },
];

describe("founder change browser client", () => {
  itSendsEachClientCall(calls);
});
