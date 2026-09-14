import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE as deleteDocument } from "@/app/api/startup/documents/[id]/route";
import { DELETE as unshareDocument } from "@/app/api/startup/documents/[id]/shares/[mentorId]/route";
import { POST as shareDocument } from "@/app/api/startup/documents/[id]/shares/route";
import {
  deleteStartupDocument,
  shareStartupDocument,
  unshareStartupDocument,
} from "@/lib/api/startup-documents";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/startup-documents", () => ({
  deleteStartupDocument: vi.fn(),
  shareStartupDocument: vi.fn(),
  unshareStartupDocument: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const url = "http://localhost/api/startup/documents/doc-1";

describe("startup document routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("shares a document with a mentor as the session user", async () => {
    vi.mocked(shareStartupDocument).mockResolvedValue({
      status: 200,
      data: { id: "doc-1" },
      headers: {},
    } as never);

    const response = await shareDocument(
      new NextRequest(`${url}/shares`, {
        method: "POST",
        body: JSON.stringify({ mentorId: "mentor-1" }),
      }),
      { params: Promise.resolve({ id: "doc-1" }) },
    );

    expect(shareStartupDocument).toHaveBeenCalledWith(
      "doc-1",
      "user-1",
      "mentor-1",
    );
    expect(response.status).toBe(200);
  });

  it("stops sharing with a mentor", async () => {
    vi.mocked(unshareStartupDocument).mockResolvedValue({
      status: 200,
      data: { id: "doc-1" },
      headers: {},
    } as never);

    await unshareDocument(new NextRequest(`${url}/shares/mentor-1`), {
      params: Promise.resolve({ id: "doc-1", mentorId: "mentor-1" }),
    });

    expect(unshareStartupDocument).toHaveBeenCalledWith(
      "doc-1",
      "mentor-1",
      "user-1",
    );
  });

  it("deletes a document and answers with no content", async () => {
    vi.mocked(deleteStartupDocument).mockResolvedValue({
      status: 204,
      data: null,
      headers: {},
    } as never);

    const response = await deleteDocument(new NextRequest(url), {
      params: Promise.resolve({ id: "doc-1" }),
    });

    expect(deleteStartupDocument).toHaveBeenCalledWith("doc-1", "user-1");
    expect(response.status).toBe(204);
  });

  it("passes on a refusal from the backend", async () => {
    vi.mocked(deleteStartupDocument).mockResolvedValue({
      status: 400,
      data: { message: "Only the uploader or the founder can delete" },
      headers: {},
    } as never);

    const response = await deleteDocument(new NextRequest(url), {
      params: Promise.resolve({ id: "doc-1" }),
    });

    expect(response.status).toBe(400);
  });
});
