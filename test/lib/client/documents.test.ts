import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentKind } from "@/interfaces/startup-document";
import { ClientApiError } from "@/lib/client/api";
import { uploadDocument } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/http-client", () => ({
  httpClient: { post: vi.fn() },
  UPLOAD_TIMEOUT_MS: 120000,
}));

vi.mock("@/lib/firebase/auth", () => ({
  currentIdToken: vi.fn(),
}));

const file = new File(["cv"], "cv.pdf", { type: "application/pdf" });

describe("uploadDocument", () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockReset();
    vi.mocked(currentIdToken).mockReset();
  });

  it("uploads directly to the backend, not the Next.js proxy", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: {
        id: "doc-1",
        kind: "cv",
        originalFilename: "cv.pdf",
        sizeBytes: 2,
      },
    });

    await uploadDocument(file, DocumentKind.Cv, "id-token");

    const [url, , config] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    expect(url).toMatch(/^http:\/\/localhost:8080\/api\/documents$/);
    expect(config).toMatchObject({
      headers: { Authorization: "Bearer id-token" },
    });
  });

  it("falls back to the Next.js proxy when the public backend is unreachable", async () => {
    vi.mocked(httpClient.post)
      .mockRejectedValueOnce(
        new ClientApiError("Sunucuya ulaşılamadı.", 0, "NETWORK"),
      )
      .mockResolvedValueOnce({
        status: 201,
        data: {
          id: "doc-1",
          kind: "requested-doc",
          originalFilename: "cv.pdf",
          sizeBytes: 2,
        },
      });

    await uploadDocument(file, DocumentKind.RequestedDoc, "id-token");

    expect(httpClient.post).toHaveBeenCalledTimes(2);
    expect(itemAt(vi.mocked(httpClient.post).mock.calls, 1)[0]).toBe(
      "/api/documents",
    );
  });

  it("says why the backend refused the file, in Turkish", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 400,
      data: { status: 400, message: "The file is too large." },
    });

    await expect(
      uploadDocument(file, DocumentKind.PitchDeck, "id-token"),
    ).rejects.toThrow("Dosya boyut sınırını aşıyor.");
  });

  it("keeps the proxy's refusal instead of blaming the connection", async () => {
    vi.mocked(httpClient.post)
      .mockRejectedValueOnce(
        new ClientApiError("Sunucuya ulaşılamadı.", 0, "NETWORK"),
      )
      .mockResolvedValueOnce({
        status: 400,
        data: {
          status: 400,
          message: "Please upload a PDF, DOCX or XLSX file.",
        },
      });

    await expect(
      uploadDocument(file, DocumentKind.Other, "id-token"),
    ).rejects.toThrow(
      "Yalnızca PDF, DOCX, XLSX veya PPTX dosyası yükleyebilirsin.",
    );
  });

  it("asks the user to check the connection when neither route answers", async () => {
    vi.mocked(httpClient.post).mockRejectedValue(
      new ClientApiError("Sunucuya ulaşılamadı.", 0, "NETWORK"),
    );

    await expect(
      uploadDocument(file, DocumentKind.Other, "id-token"),
    ).rejects.toThrow(
      "Dosya sunucusuna ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
    );
  });

  it("resolves a fresh Firebase token when the caller doesn't pass one", async () => {
    vi.mocked(currentIdToken).mockResolvedValue("fresh-token");
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: {
        id: "doc-1",
        kind: "cv",
        originalFilename: "cv.pdf",
        sizeBytes: 2,
      },
    });

    await uploadDocument(file, DocumentKind.Cv);

    expect(currentIdToken).toHaveBeenCalled();
    const [, , config] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    expect(config).toMatchObject({
      headers: { Authorization: "Bearer fresh-token" },
    });
  });

  it("attaches the upload to a meeting when given one", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: {
        id: "doc-2",
        kind: "meeting-file",
        originalFilename: "cv.pdf",
        sizeBytes: 2,
      },
    });

    await uploadDocument(
      file,
      DocumentKind.MeetingFile,
      "id-token",
      "meeting-1",
    );

    const [, body] = itemAt(vi.mocked(httpClient.post).mock.calls, 0);
    if (!(body instanceof FormData)) {
      throw new Error("Expected the upload to post FormData");
    }
    expect(body.get("meetingId")).toBe("meeting-1");
    expect(body.get("kind")).toBe("meeting-file");
  });

  it("fails clearly instead of uploading unauthenticated", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(uploadDocument(file, DocumentKind.Cv)).rejects.toThrow(
      "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
    );
    expect(httpClient.post).not.toHaveBeenCalled();
  });
});
