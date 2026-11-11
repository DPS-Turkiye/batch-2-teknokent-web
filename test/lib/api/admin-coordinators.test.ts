import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addCoordinator,
  fetchCoordinatorCandidate,
  resendCoordinatorPasswordSetup,
  setCoordinatorAccess,
} from "@/lib/api/admin-coordinators";
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
    "looks a coordinator candidate up by e-mail",
    () => fetchCoordinatorCandidate("admin-1", "new@x.demo"),
    {
      method: "GET",
      url: "/api/admin/coordinators/candidate",
      params: { actorId: "admin-1", email: "new@x.demo" },
    },
  ],
  [
    "adds a coordinator with the actor added to the body",
    () =>
      addCoordinator("admin-1", { fullName: "Yeni Kişi", email: "new@x.demo" }),
    {
      method: "POST",
      url: "/api/admin/coordinators",
      data: { fullName: "Yeni Kişi", email: "new@x.demo", actorId: "admin-1" },
    },
  ],
  [
    "turns an encoded coordinator's access off",
    () => setCoordinatorAccess("admin-1", "coord/1", false),
    {
      method: "PUT",
      url: "/api/admin/coordinators/coord%2F1/access",
      data: { actorId: "admin-1", active: false },
    },
  ],
  [
    "sends the password setup e-mail again",
    () => resendCoordinatorPasswordSetup("admin-1", "coord/1"),
    {
      method: "POST",
      url: "/api/admin/coordinators/coord%2F1/password-setup",
      params: { actorId: "admin-1" },
    },
  ],
];

describe("admin coordinators server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
