import { describe, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  changeFounder,
  getFounderChangeOptions,
} from "@/lib/client/founder-change";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const calls: ClientCall[] = [
  {
    title: "getFounderChangeOptions reads the encoded startup with the token",
    call: () => getFounderChangeOptions("org/1"),
    method: "get",
    args: ["/api/organizations/org%2F1/founder"],
  },
  {
    title: "changeFounder posts the new founder with the token",
    call: () => changeFounder("org-1", "member-1"),
    method: "post",
    args: ["/api/organizations/org-1/founder", { newFounderId: "member-1" }],
  },
];

describe("founder change browser client", () => {
  itSendsEachClientCall(calls, backendHttp);
});
