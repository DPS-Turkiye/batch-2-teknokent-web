import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchAdminInterventions,
  openAdminIntervention,
  resolveAdminIntervention,
} from "@/lib/api/admin-interventions";
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
    "lists interventions",
    () => fetchAdminInterventions("admin-1"),
    {
      method: "GET",
      url: "/api/admin/interventions",
      params: { actorId: "admin-1" },
    },
  ],
  [
    "opens an intervention with the actor added to the body",
    () =>
      openAdminIntervention("admin-1", {
        mentorshipId: "ms-1",
        action: "CALL",
        note: "Ara",
      }),
    {
      method: "POST",
      url: "/api/admin/interventions",
      data: {
        mentorshipId: "ms-1",
        action: "CALL",
        note: "Ara",
        actorId: "admin-1",
      },
    },
  ],
  [
    "resolves an encoded intervention",
    () => resolveAdminIntervention("admin-1", "int/1"),
    {
      method: "PUT",
      url: "/api/admin/interventions/int%2F1/resolve",
      data: { actorId: "admin-1" },
    },
  ],
];

describe("admin interventions server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
