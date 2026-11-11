import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { recommendMentors } from "@/lib/api/mentor-recommendations";
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
    "asks for recommendations with the payload as the body and the actor in the query",
    () => recommendMentors({ need: "Fonlama" }, "member-1"),
    {
      method: "POST",
      url: "/api/mentor-recommendations",
      data: { need: "Fonlama" },
      params: { actorId: "member-1" },
    },
  ],
];

describe("mentor recommendations server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
