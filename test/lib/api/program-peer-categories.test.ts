import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  fetchProgramPeerCategories,
  replaceProgramPeerCategories,
} from "@/lib/api/program-peer-categories";
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
    "reads an encoded program's active categories",
    () => fetchProgramPeerCategories("coord-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/peer-categories",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "replaces the program's categories",
    () =>
      replaceProgramPeerCategories("coord-1", "prog/1", [
        PeerTopicCategory.CampusLife,
        PeerTopicCategory.International,
      ]),
    {
      method: "PUT",
      url: "/api/coordinator/programs/prog%2F1/peer-categories",
      data: {
        actorId: "coord-1",
        categories: [
          PeerTopicCategory.CampusLife,
          PeerTopicCategory.International,
        ],
      },
    },
  ],
];

describe("program peer categories server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
