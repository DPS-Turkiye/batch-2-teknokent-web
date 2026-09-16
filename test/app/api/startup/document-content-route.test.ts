import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/startup/documents/[id]/content/route";
import { fetchDocumentDownloadUrl } from "@/lib/api/startup-documents";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/startup-documents", () => ({
  fetchDocumentDownloadUrl: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("/api/startup/documents/[id]/content", () => {
  beforeEach(() => {
    vi.mocked(fetchDocumentDownloadUrl).mockReset();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream(),
        headers: new Headers({ "content-type": "application/pdf" }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams the signed file inline for the session user", async () => {
    vi.mocked(fetchDocumentDownloadUrl).mockResolvedValue({
      status: 200,
      data: {
        url: "https://bucket.s3/min.pdf?sig",
        filename: "min.pdf",
        contentType: "application/pdf",
      },
      headers: {},
    } as never);

    const response = await GET(
      new NextRequest("http://localhost/api/startup/documents/doc-1/content"),
      { params: Promise.resolve({ id: "doc-1" }) },
    );

    expect(fetchDocumentDownloadUrl).toHaveBeenCalledWith("doc-1", "user-1");
    expect(fetch).toHaveBeenCalledWith("https://bucket.s3/min.pdf?sig");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="min.pdf"',
    );
  });

  it("passes on a refusal from the backend", async () => {
    vi.mocked(fetchDocumentDownloadUrl).mockResolvedValue({
      status: 403,
      data: { message: "You cannot open this document" },
      headers: {},
    } as never);

    const response = await GET(
      new NextRequest("http://localhost/api/startup/documents/doc-2/content"),
      { params: Promise.resolve({ id: "doc-2" }) },
    );

    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });
});
