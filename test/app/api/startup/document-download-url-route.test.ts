import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/startup/documents/[id]/download-url/route";
import { fetchDocumentDownloadUrl } from "@/lib/api/startup-documents";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/startup-documents", () => ({
  fetchDocumentDownloadUrl: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("/api/startup/documents/[id]/download-url", () => {
  beforeEach(() => {
    vi.mocked(fetchDocumentDownloadUrl).mockReset();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("asks the backend for a link as the session user", async () => {
    vi.mocked(fetchDocumentDownloadUrl).mockResolvedValue({
      status: 200,
      data: { url: "https://bucket.s3/deck.pdf?sig", filename: "deck.pdf" },
      headers: {},
    } as never);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/startup/documents/doc-1/download-url",
      ),
      { params: Promise.resolve({ id: "doc-1" }) },
    );

    expect(fetchDocumentDownloadUrl).toHaveBeenCalledWith("doc-1", "user-1");
    expect((await response.json()).url).toBe("https://bucket.s3/deck.pdf?sig");
  });

  it("passes on a refusal from the backend", async () => {
    vi.mocked(fetchDocumentDownloadUrl).mockResolvedValue({
      status: 400,
      data: { message: "You cannot open this document" },
      headers: {},
    } as never);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/startup/documents/doc-2/download-url",
      ),
      { params: Promise.resolve({ id: "doc-2" }) },
    );

    expect(response.status).toBe(400);
  });
});
