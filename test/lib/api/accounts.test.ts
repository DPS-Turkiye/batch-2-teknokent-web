import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchUser } from "@/lib/api/accounts";
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
