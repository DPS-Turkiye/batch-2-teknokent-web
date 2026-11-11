import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchInviteCode,
  regenerateInviteCode,
} from "@/lib/api/organization-invite";
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
    "reads an encoded startup's invite code",
    () => fetchInviteCode("org/1", "founder-1"),
    {
      method: "GET",
      url: "/api/organizations/org%2F1/invite-code",
      params: { actorId: "founder-1" },
    },
  ],
  [
    "regenerates the invite code with the actor in the body",
    () => regenerateInviteCode("org/1", "founder-1"),
    {
      method: "POST",
      url: "/api/organizations/org%2F1/invite-code",
      data: { actorId: "founder-1" },
    },
  ],
];

describe("organization invite server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
