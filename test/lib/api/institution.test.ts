import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAdviseeProfile,
  fetchInstitutionAdvisees,
  fetchInstitutionRecord,
} from "@/lib/api/institution";
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
    "reads the actor's institution record",
    () => fetchInstitutionRecord("user-1"),
    {
      method: "GET",
      url: "/api/institution/me",
      params: { actorId: "user-1" },
    },
  ],
  [
    "lists the actor's advisees",
    () => fetchInstitutionAdvisees("user-1"),
    {
      method: "GET",
      url: "/api/institution/me/advisees",
      params: { actorId: "user-1" },
    },
  ],
  [
    "reads one advisee's interests and goal as the actor",
    () => fetchAdviseeProfile("user-1", "student-1"),
    {
      method: "GET",
      url: "/api/institution/me/advisees/student-1/profile",
      params: { actorId: "user-1" },
    },
  ],
];

describe("institution server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
