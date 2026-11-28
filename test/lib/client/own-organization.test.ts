import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  ownOrganizationId,
  ownOrganizationPath,
} from "@/lib/client/own-organization";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("the signed-in person's own startup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is read from the backend's account, one ask shared by calls made together", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: { id: "user-1", organizationId: "org/1" },
    });

    const [id, path] = await Promise.all([
      ownOrganizationId(),
      ownOrganizationPath("/members"),
    ]);

    expect(id).toBe("org/1");
    expect(path).toBe("/api/organizations/org%2F1/members");
    expect(backendHttp.get).toHaveBeenCalledTimes(1);
    expect(backendHttp.get).toHaveBeenCalledWith("/api/auth/me");
  });

  // Joining, leaving or a coordinator's move changes it, so nothing is kept between asks.
  it("is asked afresh later", async () => {
    vi.mocked(backendHttp.get)
      .mockResolvedValueOnce({ status: 200, data: { organizationId: "org-1" } })
      .mockResolvedValueOnce({
        status: 200,
        data: { organizationId: "org-2" },
      });

    expect(await ownOrganizationId()).toBe("org-1");
    expect(await ownOrganizationId()).toBe("org-2");
  });

  it("is a 403 for someone without a startup, as the app's routes answered", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({
      status: 200,
      data: { id: "user-1", organizationId: null },
    });

    await expect(ownOrganizationPath()).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("passes the backend's refusal on", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 401, data: {} });

    await expect(ownOrganizationId()).rejects.toMatchObject({ status: 401 });
  });
});
