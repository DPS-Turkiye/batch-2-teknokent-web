import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/client/organization-members";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/client/own-organization", async () =>
  (await import("@test/mocks/own-organization")).ownOrganizationMock(),
);

describe("organization member client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("edits a member on the caller's own startup", async () => {
    vi.mocked(backendHttp.patch).mockResolvedValue({
      status: 200,
      data: { id: "c 1" },
    });

    await updateOrganizationMember("c 1", {
      fullName: "Kerem Aksoy",
      jobTitle: "CTO",
    });

    expect(backendHttp.patch).toHaveBeenCalledWith(
      "/api/organizations/org%2F1/members/c%201",
      {
        fullName: "Kerem Aksoy",
        jobTitle: "CTO",
      },
    );
  });

  it("removes a member and surfaces a refusal", async () => {
    vi.mocked(backendHttp.delete)
      .mockResolvedValueOnce({ status: 204, data: "" })
      .mockResolvedValueOnce({ status: 403, data: {} });

    await removeOrganizationMember("cto");
    await expect(removeOrganizationMember("founder")).rejects.toThrow(
      /yetkin yok/,
    );

    expect(backendHttp.delete).toHaveBeenCalledWith(
      "/api/organizations/org%2F1/members/cto",
    );
  });
});
