import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  changeFounder,
  fetchFounderChangeOptions,
} from "@/lib/api/founder-change";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("founder change backend client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks for the founder and candidates with the caller's own token", async () => {
    await fetchFounderChangeOptions("org/1", "id-token");

    expect(backendRequest).toHaveBeenCalledWith(
      { method: "GET", url: "/api/organizations/org%2F1/founder" },
      { idToken: "id-token" },
    );
  });

  it("posts the new founder with the caller's own token", async () => {
    await changeFounder("org-1", "member-1", "id-token");

    expect(backendRequest).toHaveBeenCalledWith(
      {
        method: "POST",
        url: "/api/organizations/org-1/founder",
        data: { newFounderId: "member-1" },
      },
      { idToken: "id-token" },
    );
  });
});
