import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentKind } from "@/interfaces/startup-document";
import { ClientApiError } from "@/lib/client/api";
import {
  isUploadCanceled,
  uploadDocument,
  uploadDocumentWithProgress,
} from "@/lib/client/documents";
import { currentIdToken } from "@/lib/firebase/auth";
import { httpClient } from "@/lib/http-client";
import { itemAt } from "@test/fixtures/list-assertions";

vi.mock("@/lib/http-client", () => ({
  httpClient: { post: vi.fn() },
  UPLOAD_TIMEOUT_MS: 120000,
  UPLOAD_STALL_MS: 20000,
  UPLOAD_CONNECT_MS: 30000,
  UPLOAD_RESPONSE_TIMEOUT_MS: 60000,
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

type UploadConfig = {
  signal: AbortSignal;
  timeout: number;
  onUploadProgress: (event: {
    loaded: number;
    total?: number;
    progress?: number;
  }) => void;
};

/** The config the last upload was sent with, and a post that settles only when told (or aborted). */
function pendingPost() {
  let settle: (response: { status: number; data: unknown }) => void = () =>
    undefined;
  vi.mocked(httpClient.post).mockImplementation(
    (_url, _data, config) =>
      new Promise((resolve, reject) => {
        settle = resolve;
        (config as UploadConfig | undefined)?.signal.addEventListener(
          "abort",
          () => reject(new Error("canceled")),
        );
      }),
  );
  const config = () =>
    itemAt(vi.mocked(httpClient.post).mock.calls, 0)[2] as UploadConfig;
  return {
    config,
    settle: (response: { status: number; data: unknown }) => settle(response),
  };
}

const STORED = {
  status: 201,
  data: {
    id: "doc-1",
    kind: "homework",
    originalFilename: "cv.pdf",
    sizeBytes: 2,
  },
};

describe("upload stall and progress", () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gives up an upload that never starts sending after 30 seconds, without trying the proxy", async () => {
    pendingPost();
    const upload = uploadDocument(file, DocumentKind.Homework, "id-token");
    // Caught now so the rejection is not unhandled while the clock moves.
    const failure = upload.catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(29_000);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(await failure).toMatchObject({
      code: "TIMEOUT",
      message:
        "Yükleme ilerlemiyor; bağlantın yavaş ya da kesilmiş olabilir. Tekrar dene.",
    });
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("gives up an upload whose progress stops for 20 seconds part way", async () => {
    const post = pendingPost();
    const upload = uploadDocument(file, DocumentKind.Homework, "id-token");
    const failure = upload.catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    post.config().onUploadProgress({ loaded: 1, total: 4 });

    await vi.advanceTimersByTimeAsync(20_000);

    expect(await failure).toMatchObject({ code: "TIMEOUT" });
  });

  it("keeps a slow upload going while it still reports progress, and passes the progress on", async () => {
    const post = pendingPost();
    const onProgress = vi.fn<(sent: number) => void>();
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    const upload = uploadDocumentWithProgress(file, DocumentKind.Homework, {
      onProgress,
    });
    await vi.advanceTimersByTimeAsync(0);

    for (const loaded of [1, 2, 3]) {
      await vi.advanceTimersByTimeAsync(15_000);
      post.config().onUploadProgress({ loaded, total: 4 });
    }
    post.settle(STORED);

    await expect(upload).resolves.toMatchObject({ id: "doc-1" });
    expect(vi.getTimerCount()).toBe(0);
    post.config().onUploadProgress({ loaded: 4, total: 4 });
    expect(vi.getTimerCount()).toBe(0);
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress.mock.calls.map(([sent]) => sent)).toEqual([
      0.25, 0.5, 0.75,
    ]);
    expect(post.config().timeout).toBe(0);
  });

  it("stops on İptal, without trying the proxy or leaving a timer", async () => {
    pendingPost();
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    const controller = new AbortController();
    const upload = uploadDocumentWithProgress(file, DocumentKind.Homework, {
      signal: controller.signal,
    });
    const failure = upload.catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);

    controller.abort();

    const error = await failure;
    expect(isUploadCanceled(error)).toBe(true);
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not start an upload that was already stopped", async () => {
    vi.mocked(currentIdToken).mockResolvedValue("id-token");
    const controller = new AbortController();
    controller.abort();

    const stopped = await uploadDocumentWithProgress(
      file,
      DocumentKind.Homework,
      {
        signal: controller.signal,
      },
    ).catch((caught: unknown) => caught);

    expect(isUploadCanceled(stopped)).toBe(true);
    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it("waits up to a minute for the answer once the whole file is out", async () => {
    const post = pendingPost();
    const upload = uploadDocument(file, DocumentKind.Homework, "id-token");
    // Caught now so the rejection is not unhandled while the clock moves.
    const failure = upload.catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    post.config().onUploadProgress({ loaded: 4, total: 4 });

    await vi.advanceTimersByTimeAsync(59_000);
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000);

    expect(await failure).toMatchObject({
      code: "TIMEOUT",
      message:
        "Dosya gönderildi ama sunucu yanıt vermedi. Tekrar denemeden önce dosyalarına bak; yüklenmiş olabilir.",
    });
  });
});
