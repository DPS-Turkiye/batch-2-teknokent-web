import { beforeEach, describe, vi } from "vitest";

import { UserAccountStatus } from "@/interfaces/session";
import {
  decidePendingAccount,
  getPendingAccounts,
  revokeUserSignIns,
} from "@/lib/client/admin-users";
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
    title: "getPendingAccounts lists the accounts waiting for a decision",
    call: () => getPendingAccounts(),
    method: "get",
    args: ["/api/users", { params: { status: UserAccountStatus.Pending } }],
  },
  {
    title: "decidePendingAccount sends the decision, naming nobody",
    call: () => decidePendingAccount("u/1", UserAccountStatus.Approved),
    method: "patch",
    args: ["/api/users/u%2F1/status", { status: UserAccountStatus.Approved }],
  },
  {
    title: "revokeUserSignIns ends the user's sign-ins",
    call: () => revokeUserSignIns("u/1"),
    method: "post",
    args: ["/api/users/u%2F1/sign-ins/revoke", {}],
  },
];

describe("admin users client, straight to the backend", () => {
  beforeEach(() => vi.clearAllMocks());

  itSendsEachClientCall(calls, backendHttp);
});
