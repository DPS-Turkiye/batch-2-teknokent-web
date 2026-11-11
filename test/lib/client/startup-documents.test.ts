import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteDocument,
  shareDocument,
  unshareDocument,
} from "@/lib/client/startup-documents";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/http-client", () => ({
  httpClient: { delete: vi.fn(), get: vi.fn(), post: vi.fn() },
}));

describe("startup document client", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shares through the app's own proxy", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 200,
      data: { id: "doc 1" },
    });

    await expect(shareDocument("doc 1", "mentor-1")).resolves.toEqual({
      id: "doc 1",
    });
    expect(httpClient.post).toHaveBeenCalledWith(
      "/api/startup/documents/doc%201/shares",
      {
        mentorId: "mentor-1",
      },
    );
  });

  it("unshares and deletes by id", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue({
      status: 204,
      data: "",
    });

    await unshareDocument("doc-1", "mentor-1");
    await deleteDocument("doc-1");

    expect(vi.mocked(httpClient.delete).mock.calls.map(([url]) => url)).toEqual(
      [
        "/api/startup/documents/doc-1/shares/mentor-1",
        "/api/startup/documents/doc-1",
      ],
    );
  });

  it("turns a refusal into an error", async () => {
    vi.mocked(httpClient.delete).mockResolvedValue({
      status: 404,
      data: {},
    });

    await expect(deleteDocument("doc-1")).rejects.toThrow(
      "Aradığın kayıt bulunamadı.",
    );
  });
});
