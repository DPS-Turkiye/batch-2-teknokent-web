import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createStartup,
  fetchOrganization,
  joinStartup,
  resubmitStartup,
} from "@/lib/api/organization";
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
    "reads an encoded startup's profile",
    () => fetchOrganization("org/1"),
    { method: "GET", url: "/api/organizations/org%2F1" },
  ],
  [
    "joins a startup with an invite code",
    () => joinStartup("user-1", "ABC123"),
    {
      method: "POST",
      url: "/api/organizations/join",
      data: { actorId: "user-1", inviteCode: "ABC123" },
    },
  ],
  [
    "creates the actor's own startup with the actor added to the body",
    () =>
      createStartup("user-1", {
        name: "Orbit",
        supportAreas: ["Fonlama"],
        teamMembers: [{ fullName: "Ada" }],
      }),
    {
      method: "POST",
      url: "/api/organizations/mine",
      data: {
        name: "Orbit",
        supportAreas: ["Fonlama"],
        teamMembers: [{ fullName: "Ada" }],
        actorId: "user-1",
      },
    },
  ],
  [
    "sends a rejected startup back for review",
    () => resubmitStartup("org/1", "founder-1"),
    {
      method: "POST",
      url: "/api/organizations/org%2F1/resubmit",
      params: { actorId: "founder-1" },
    },
  ],
];

describe("organization server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
