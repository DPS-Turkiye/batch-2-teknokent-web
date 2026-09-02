import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/profile-analysis/preview/route";
import { parseCvPreview } from "@/lib/api/profile-analysis";

vi.mock("@/lib/api/profile-analysis", () => ({
  parseCvPreview: vi.fn(),
}));

// Stubs formData() the way the sibling /api/documents test does: NextRequest's
// own multipart parsing does not round-trip a Blob in this environment.
function upload(options: { file?: Blob | null } = {}) {
  const form = new FormData();
  if (options.file !== null) {
    form.set(
      "file",
      options.file ?? new Blob(["cv"], { type: "application/pdf" }),
    );
  }
  return { formData: async () => form } as unknown as NextRequest;
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/profile-analysis/preview", () => {
  // Unlike its sibling POST /, this one must work with no session: the caller is
  // half-way through signup and has no account yet.
  it("parses without requiring a session", async () => {
    vi.mocked(parseCvPreview).mockResolvedValue({
      data: { current_role: "Ürün Yöneticisi" },
      headers: {},
      status: 200,
    });

    const response = await POST(upload());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      current_role: "Ürün Yöneticisi",
    });
  });

  it("rejects a request with no file", async () => {
    const response = await POST(upload({ file: null }));

    expect(response.status).toBe(400);
    expect(parseCvPreview).not.toHaveBeenCalled();
  });

  it("surfaces a backend failure as a readable message", async () => {
    vi.mocked(parseCvPreview).mockRejectedValue(new Error("boom"));

    const response = await POST(upload());

    expect(response.status).toBeGreaterThanOrEqual(400);
    await expect(response.json()).resolves.toMatchObject({
      message: expect.stringContaining("CV okunamadı"),
    });
  });
});
