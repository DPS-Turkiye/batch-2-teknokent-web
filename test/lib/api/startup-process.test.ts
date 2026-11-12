import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchStartupProcess,
  submitProcessAssignment,
} from "@/lib/api/startup-process";
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
    "reads an encoded startup's process",
    () => fetchStartupProcess("org/1", "member-1"),
    {
      method: "GET",
      url: "/api/organizations/org%2F1/process",
      params: { actorId: "member-1" },
    },
  ],
  [
    "submits a document for an encoded assignment",
    () => submitProcessAssignment("org/1", "asg 1", "member-1", "doc-1"),
    {
      method: "PUT",
      url: "/api/organizations/org%2F1/process/assignments/asg%201/submission",
      data: { actorId: "member-1", documentId: "doc-1" },
    },
  ],
];

describe("startup process server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
