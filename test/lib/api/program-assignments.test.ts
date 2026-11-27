import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createProgramAssignment,
  deleteProgramAssignment,
  fetchProgramAssignments,
  updateProgramAssignment,
} from "@/lib/api/program-assignments";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const input = {
  title: "Pazar araştırması",
  description: null,
  dueDate: "2026-12-01",
  phaseId: "phase-1",
  fileRequired: true,
};

const cases: RequestCase[] = [
  [
    "lists an encoded program's Ödevler",
    () => fetchProgramAssignments("coord-1", "prog/1"),
    {
      method: "GET",
      url: "/api/coordinator/programs/prog%2F1/assignments",
      params: { actorId: "coord-1" },
    },
  ],
  [
    "gives an Ödev to every team with the actor first",
    () => createProgramAssignment("coord-1", "prog/1", input),
    {
      method: "POST",
      url: "/api/coordinator/programs/prog%2F1/assignments",
      data: { actorId: "coord-1", ...input },
    },
  ],
  [
    "edits an encoded Ödev of an encoded program with the actor first",
    () =>
      updateProgramAssignment("coord-1", "prog/1", "odev/1", {
        title: "Pazar analizi",
        description: null,
        dueDate: null,
      }),
    {
      method: "PUT",
      url: "/api/coordinator/programs/prog%2F1/assignments/odev%2F1",
      data: {
        actorId: "coord-1",
        title: "Pazar analizi",
        description: null,
        dueDate: null,
      },
    },
  ],
  [
    "deletes an encoded Ödev of an encoded program with the actor as a query",
    () => deleteProgramAssignment("coord-1", "prog/1", "odev/1"),
    {
      method: "DELETE",
      url: "/api/coordinator/programs/prog%2F1/assignments/odev%2F1",
      params: { actorId: "coord-1" },
    },
  ],
];

describe("program assignments server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
