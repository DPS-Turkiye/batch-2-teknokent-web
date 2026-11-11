import { beforeEach, describe, expect, it, vi } from "vitest";

import { listStoredDocuments, uploadStoredDocument } from "@/lib/api/documents";
import { UPLOAD_TIMEOUT_MS } from "@/lib/http-client";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

describe("stored documents server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it("lists the token owner's documents without a user filter", async () => {
    await listStoredDocuments({ idToken: "id-token" });

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "GET", url: "/api/documents", params: undefined },
      { idToken: "id-token" },
    ]);
  });

  it("lists one user's documents with the server's own credentials", async () => {
    await listStoredDocuments({ userId: "user-1" });

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      { method: "GET", url: "/api/documents", params: { userId: "user-1" } },
      { idToken: undefined },
    ]);
  });

  it("uploads the form with the long upload timeout, signed with the token", async () => {
    const formData = new FormData();
    formData.append("title", "Pitch deck");

    await uploadStoredDocument({ formData, idToken: "id-token" });

    expect(vi.mocked(backendRequest).mock.lastCall).toEqual([
      {
        method: "POST",
        url: "/api/documents",
        data: formData,
        timeout: UPLOAD_TIMEOUT_MS,
      },
      { idToken: "id-token" },
    ]);
  });
});
