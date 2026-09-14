import { beforeEach, describe, expect, it, vi } from "vitest";

import { uploadDocument } from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";

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

  // Reported: the Amplify-hosted proxy's own edge blocks any request body
  // over ~8KB, so this goes straight to the backend instead.
  it("uploads directly to the backend, not the Next.js proxy", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      status: 201,
      data: {
        id: "doc-1",
        kind: "cv",
        originalFilename: "cv.pdf",
        sizeBytes: 2,
      },
    } as never);

    await uploadDocument(file, "cv", "id-token");

    const [url, , config] = vi.mocked(httpClient.post).mock.calls[0];
    expect(url).toMatch(/^http:\/\/localhost:8080\/api\/documents$/);
    expect(config).toMatchObject({
      headers: { Authorization: "Bearer id-token" },
    });
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
    } as never);

    await uploadDocument(file, "cv");

    expect(currentIdToken).toHaveBeenCalled();
    const [, , config] = vi.mocked(httpClient.post).mock.calls[0];
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
    } as never);

    await uploadDocument(file, "meeting-file", "id-token", "meeting-1");

    const [, body] = vi.mocked(httpClient.post).mock.calls[0];
    expect((body as FormData).get("meetingId")).toBe("meeting-1");
    expect((body as FormData).get("kind")).toBe("meeting-file");
  });

  it("fails clearly instead of uploading unauthenticated", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(uploadDocument(file, "cv")).rejects.toThrow(
      "Oturumunuz sona erdi. Lütfen tekrar giriş yapın.",
    );
    expect(httpClient.post).not.toHaveBeenCalled();
  });
});
