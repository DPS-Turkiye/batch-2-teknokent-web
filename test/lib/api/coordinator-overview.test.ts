import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCoordinatorOverview } from "@/lib/api/coordinator-overview";
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
    "reads the overview of every program when no program is picked",
    () => fetchCoordinatorOverview("coord-1", null),
    {
      method: "GET",
      url: "/api/coordinator/overview",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "narrows the overview to the picked program",
    () => fetchCoordinatorOverview("coord-1", "prog-1"),
    {
      method: "GET",
      url: "/api/coordinator/overview",
      params: { actorId: "coord-1", programId: "prog-1" },
    },
  ],
];

describe("coordinator overview server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
