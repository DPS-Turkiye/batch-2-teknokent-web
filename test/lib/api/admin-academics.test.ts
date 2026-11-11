import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAdminAcademics,
  fetchProgramAcademics,
} from "@/lib/api/admin-academics";
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
    "lists a program's academics for an encoded program",
    () => fetchProgramAcademics("admin-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/academics",
      params: { actorId: "admin-1" },
    },
  ],
  [
    "lists every academic",
    () => fetchAdminAcademics("admin-1"),
    {
      method: "GET",
      url: "/api/admin/academics",
      params: { actorId: "admin-1" },
    },
  ],
];

describe("admin academics server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
