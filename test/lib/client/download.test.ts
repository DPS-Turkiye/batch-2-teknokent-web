import { AxiosHeaders, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { backendHttp } from "@/lib/client/backend-http";
import { downloadBackendFile } from "@/lib/client/download";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

function fileResponse(
  data: Blob,
  status: number,
  headers: Record<string, string> = {},
): AxiosResponse<Blob> {
  return {
    data,
    status,
    statusText: "",
    headers,
    config: { headers: new AxiosHeaders() },
  };
}

const URL_PATH = "/api/coordinator/programs/p-1/sessions/export";
const PARAMS = { from: "2026-11-01", to: "2026-11-30", format: "CSV" };

describe("downloadBackendFile", () => {
  let saved: { href: string; download: string }[];

  beforeEach(() => {
    vi.clearAllMocks();
    saved = [];
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:file-1"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks for the file as a blob and saves it under the backend's name", async () => {
    const file = new Blob(["a;b"], { type: "text/csv" });
    vi.mocked(backendHttp.get).mockResolvedValue(
      fileResponse(file, 200, {
        "content-disposition":
          "attachment; filename=\"rapor.csv\"; filename*=UTF-8''G%C3%B6r%C3%BC%C5%9Fmeler.csv",
      }),
    );

    await downloadBackendFile(URL_PATH, PARAMS, "fallback.csv");

    expect(backendHttp.get).toHaveBeenCalledWith(URL_PATH, {
      params: PARAMS,
      responseType: "blob",
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(saved).toEqual([
      { href: "blob:file-1", download: "Görüşmeler.csv" },
    ]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:file-1");
  });

  it("uses the name built here when the header cannot be read", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      fileResponse(new Blob(["x"]), 200),
    );

    await downloadBackendFile(URL_PATH, PARAMS, "gorusmeler.csv");

    expect(saved).toEqual([
      { href: "blob:file-1", download: "gorusmeler.csv" },
    ]);
  });

  it("shows the backend's reason for a refusal and saves nothing", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      fileResponse(
        new Blob([
          JSON.stringify({
            code: "FORBIDDEN",
            message: "Bu programda değişiklik yapma yetkin yok.",
          }),
        ]),
        403,
      ),
    );

    await expect(
      downloadBackendFile(URL_PATH, PARAMS, "x.csv"),
    ).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "Bu programda değişiklik yapma yetkin yok.",
    });
    expect(saved).toEqual([]);
  });

  it("still refuses when the failure is not JSON", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      fileResponse(new Blob(["<html>"]), 502),
    );

    await expect(
      downloadBackendFile(URL_PATH, PARAMS, "x.csv"),
    ).rejects.toMatchObject({ status: 502 });
    expect(saved).toEqual([]);
  });
});
