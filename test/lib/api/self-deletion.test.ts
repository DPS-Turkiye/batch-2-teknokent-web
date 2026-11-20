import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteOwnAccount,
  deleteOwnStartup,
  fetchSelfDeletionOptions,
} from "@/lib/api/self-deletion";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("self-deletion backend calls", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always goes with the person's own token, never the service credentials", async () => {
    await fetchSelfDeletionOptions("id-token");
    await deleteOwnAccount("SİL", "id-token");
    await deleteOwnStartup("Döngü Labs", "id-token");

    expect(vi.mocked(backendRequest).mock.calls).toEqual([
      [{ method: "GET", url: "/api/me/deletion" }, { idToken: "id-token" }],
      [
        {
          method: "POST",
          url: "/api/me/delete",
          data: { confirmation: "SİL" },
        },
        { idToken: "id-token" },
      ],
      [
        {
          method: "POST",
          url: "/api/me/startup/delete",
          data: { confirmName: "Döngü Labs" },
        },
        { idToken: "id-token" },
      ],
    ]);
  });
});
