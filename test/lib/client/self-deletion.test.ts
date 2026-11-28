import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp, endBackendSession } from "@/lib/client/backend-http";
import {
  deleteOwnAccount,
  deleteOwnStartup,
  getSelfDeletionOptions,
} from "@/lib/client/self-deletion";
import { httpClient } from "@/lib/http-client";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);
vi.mock("@/lib/http-client", () => ({ httpClient: { delete: vi.fn() } }));

const signed = { headers: { Authorization: "Bearer id-token" } };

describe("self deletion client, straight to the backend on the person's own token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendHttp.get).mockResolvedValue({ status: 200, data: {} });
    vi.mocked(backendHttp.post).mockResolvedValue({ status: 200, data: {} });
    vi.mocked(httpClient.delete).mockResolvedValue({ status: 204, data: "" });
  });

  it("reads the options and deletes the startup on the token, naming nobody", async () => {
    await getSelfDeletionOptions("id-token");
    await deleteOwnStartup("Döngü", "id-token");

    expect(backendHttp.get).toHaveBeenCalledWith("/api/me/deletion", signed);
    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/me/startup/delete",
      { confirmName: "Döngü" },
      signed,
    );
    expect(endBackendSession).not.toHaveBeenCalled();
  });

  it("ends both sessions once the account is gone", async () => {
    await deleteOwnAccount("SİL", "id-token");

    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/me/delete",
      { confirmation: "SİL" },
      signed,
    );
    expect(httpClient.delete).toHaveBeenCalledWith("/api/session");
    expect(endBackendSession).toHaveBeenCalled();
  });

  it("keeps the sessions when the backend refuses", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue({
      status: 403,
      data: { message: "Yeniden giriş yapman gerekiyor." },
    });

    await expect(deleteOwnAccount("SİL", "id-token")).rejects.toThrow(
      "Yeniden giriş yapman gerekiyor.",
    );
    expect(endBackendSession).not.toHaveBeenCalled();
  });
});
