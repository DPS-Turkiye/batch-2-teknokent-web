import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/documents/route";
import { uploadStoredDocument } from "@/lib/api/documents";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/documents", () => ({
  uploadStoredDocument: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

function request(options: {
  token?: string;
  kind?: string;
  file?: Blob | null;
}) {
  const form = new FormData();
  if (options.file !== null) {
    form.set(
      "file",
      options.file ?? new Blob(["pdf"], { type: "application/pdf" }),
    );
  }
  if (options.kind !== undefined) form.set("kind", options.kind);
  else form.set("kind", "cv");
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "authorization" && options.token
          ? `Bearer ${options.token}`
          : null,
    },
    formData: async () => form,
  } as unknown as NextRequest;
}

describe("/api/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
    vi.mocked(uploadStoredDocument).mockResolvedValue({
      data: { id: "doc-1", kind: "cv" },
      headers: {},
      status: 201,
    });
  });

  it("forwards a Firebase token when present", async () => {
    await POST(request({ token: "id-token" }));

    expect(uploadStoredDocument).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "cv", idToken: "id-token" }),
    );
    expect(getSessionIds).not.toHaveBeenCalled();
  });

  it("uses the session user when there is no Firebase token", async () => {
    await POST(request({}));

    expect(uploadStoredDocument).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "cv", userId: "user-1" }),
    );
  });
});
