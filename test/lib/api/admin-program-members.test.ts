import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramMemberKind } from "@/interfaces/admin-overview";
import {
  assignToProgram,
  moveStartupToProgram,
  removeMentorFromProgram,
} from "@/lib/api/admin-program-members";
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
  [
    "moves a startup into the program in the path, naming the one it leaves",
    () => moveStartupToProgram("admin-1", "prog/2", "org 1", "program-1"),
    {
      method: "POST",
      url: "/api/admin/programs/prog%2F2/startups/org%201/move",
      params: { actorId: "admin-1" },
      data: { fromProgramId: "program-1" },
    },
  ],
  [
    "removes a mentor from the program in the path",
    () => removeMentorFromProgram("admin-1", "prog/1", "mentor 1"),
    {
      method: "POST",
      url: "/api/admin/programs/prog%2F1/mentors/mentor%201/remove",
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
