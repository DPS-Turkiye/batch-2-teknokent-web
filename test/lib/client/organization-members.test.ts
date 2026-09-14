import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/client/organization-members";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: { delete: vi.fn(), get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

describe("organization member client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("edits a member through the app's own proxy", async () => {
    vi.mocked(httpClient.patch).mockResolvedValue({
      status: 200,
      data: { id: "c 1" },
    } as never);

    await updateOrganizationMember("c 1", {
      fullName: "Kerem Aksoy",
      jobTitle: "CTO",
    });

    expect(httpClient.patch).toHaveBeenCalledWith(
      "/api/organization-members/c%201",
      {
        fullName: "Kerem Aksoy",
        jobTitle: "CTO",
      },
    );
  });

  it("removes a member and surfaces a refusal", async () => {
    vi.mocked(httpClient.delete)
      .mockResolvedValueOnce({ status: 204, data: "" } as never)
      .mockResolvedValueOnce({ status: 403, data: {} } as never);

    await removeOrganizationMember("cto");
    await expect(removeOrganizationMember("founder")).rejects.toThrow(
      /yetkin yok/,
    );

    expect(httpClient.delete).toHaveBeenCalledWith(
      "/api/organization-members/cto",
    );
  });
});
