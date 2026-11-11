import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmProfileAnalysis,
  createManualProfileAnalysis,
  fetchLatestProfileAnalysis,
} from "@/lib/api/profile-analysis";
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
    "reads the startup's latest analysis",
    () => fetchLatestProfileAnalysis("org-1"),
    {
      method: "GET",
      url: "/api/profile-analyses/latest",
      params: { organizationId: "org-1", appUserId: undefined },
    },
  ],
  [
    "reads one member's latest analysis",
    () => fetchLatestProfileAnalysis("org-1", "user-1"),
    {
      method: "GET",
      url: "/api/profile-analyses/latest",
      params: { organizationId: "org-1", appUserId: "user-1" },
    },
  ],
  [
    "creates a manual analysis with the payload as the body",
    () => createManualProfileAnalysis("org-1", "user-1", { summary: "x" }),
    {
      method: "POST",
      url: "/api/profile-analyses/manual",
      params: { organizationId: "org-1", appUserId: "user-1" },
      data: { summary: "x" },
    },
  ],
  [
    "confirms an encoded analysis",
    () => confirmProfileAnalysis("an/1", { confirmed: true }),
    {
      method: "PATCH",
      url: "/api/profile-analyses/an%2F1/confirmation",
      data: { confirmed: true },
    },
  ],
];

describe("profile analysis server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
