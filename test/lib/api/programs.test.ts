import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  decideProgramInvitation,
  fetchOrganizationPrograms,
  fetchPrograms,
} from "@/lib/api/programs";
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
    "lists the actor's programs",
    () => fetchPrograms("mentor-1"),
    { method: "GET", url: "/api/programs", params: { actorId: "mentor-1" } },
  ],
  [
    "lists the startup's programs",
    () => fetchOrganizationPrograms("member-1"),
    {
      method: "GET",
      url: "/api/programs/mine",
      params: { actorId: "member-1" },
    },
  ],
  [
    "answers a program invitation at the encoded program's path",
    () => decideProgramInvitation("mentor-1", "prog/1", true),
    {
      method: "POST",
      url: "/api/programs/prog%2F1/invitations/decide",
      data: { actorId: "mentor-1", accepted: true },
    },
  ],
];

describe("programs server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
