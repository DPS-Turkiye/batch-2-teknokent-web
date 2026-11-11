import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileAnalysisRecordScope } from "@/interfaces/profile-analysis";
import {
  confirmStartupProfileRecord,
  createStartupProfileRecord,
  fetchProfileAnalysisRecord,
} from "@/lib/api/profile-analysis-records";
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
    "reads the record of the asked scope",
    () =>
      fetchProfileAnalysisRecord(
        "member-1",
        ProfileAnalysisRecordScope.Startup,
      ),
    {
      method: "GET",
      url: "/api/profile-analysis-records",
      params: {
        actorId: "member-1",
        scope: ProfileAnalysisRecordScope.Startup,
      },
    },
  ],
  [
    "creates a startup record wrapping the profile",
    () => createStartupProfileRecord("member-1", { name: "Orbit" }),
    {
      method: "POST",
      url: "/api/profile-analysis-records",
      params: { actorId: "member-1" },
      data: { profile: { name: "Orbit" } },
    },
  ],
  [
    "confirms an encoded record wrapping the profile",
    () => confirmStartupProfileRecord("member-1", "rec/1", { name: "Orbit" }),
    {
      method: "PATCH",
      url: "/api/profile-analysis-records/rec%2F1",
      params: { actorId: "member-1" },
      data: { profile: { name: "Orbit" } },
    },
  ],
];

describe("profile analysis records server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
