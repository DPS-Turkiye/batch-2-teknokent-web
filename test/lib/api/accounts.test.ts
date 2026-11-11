import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  decideAccountStatus,
  fetchUser,
  fetchUsers,
  revokeSignIns,
} from "@/lib/api/accounts";
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
    "lists every user for the admin asking, when no filter is given",
    () => fetchUsers("admin-1"),
    { method: "GET", url: "/api/users", params: { actorId: "admin-1" } },
  ],
  [
    "filters users by role and status",
    () =>
      fetchUsers("admin-1", {
        role: UserRole.Mentor,
        status: UserAccountStatus.Pending,
      }),
    {
      method: "GET",
      url: "/api/users",
      params: {
        actorId: "admin-1",
        role: UserRole.Mentor,
        status: UserAccountStatus.Pending,
      },
    },
  ],
  [
    "reads one user at the encoded path as the viewer, with the default timeout",
    () => fetchUser("user/1", "viewer-1"),
    {
      method: "GET",
      url: "/api/users/user%2F1",
      params: { actorId: "viewer-1" },
    },
  ],
  [
    "reads one user with a shorter timeout when the caller asks for one",
    () => fetchUser("user/1", "viewer-1", 3000),
    {
      method: "GET",
      url: "/api/users/user%2F1",
      params: { actorId: "viewer-1" },
      timeout: 3000,
    },
  ],
  [
    "keeps the default timeout for a zero timeout",
    () => fetchUser("user/1", "viewer-1", 0),
    {
      method: "GET",
      url: "/api/users/user%2F1",
      params: { actorId: "viewer-1" },
    },
  ],
  [
    "approves or rejects an account with the actor in the body",
    () => decideAccountStatus("user/1", "admin-1", UserAccountStatus.Rejected),
    {
      method: "PATCH",
      url: "/api/users/user%2F1/status",
      data: { actorId: "admin-1", status: UserAccountStatus.Rejected },
    },
  ],
  [
    "revokes a user's sign-ins",
    () => revokeSignIns("user/1", "admin-1"),
    {
      method: "POST",
      url: "/api/users/user%2F1/sign-ins/revoke",
      data: { actorId: "admin-1" },
    },
  ],
];

describe("accounts server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
