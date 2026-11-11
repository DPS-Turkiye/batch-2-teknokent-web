import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramMemberKind } from "@/interfaces/admin-overview";
import { assignToProgram } from "@/lib/api/admin-program-members";
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
    "assigns a startup to a program under the kind's path segment",
    () =>
      assignToProgram("admin-1", "prog/1", ProgramMemberKind.Startups, "org 1"),
    {
      method: "POST",
      url: "/api/admin/programs/prog%2F1/startups/org%201",
      params: { actorId: "admin-1" },
    },
  ],
];

describe("admin program members server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
