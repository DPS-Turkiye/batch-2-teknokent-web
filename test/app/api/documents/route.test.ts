import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/documents/route";
import { listStoredDocuments } from "@/lib/api/documents";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/documents", () => ({
  listStoredDocuments: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

function request(token?: string) {
  return new NextRequest("http://localhost/api/documents", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe("/api/documents", () => {
  beforeEach(() => {
    vi.mocked(listStoredDocuments).mockReset();
    vi.mocked(getSessionIds).mockReset();
    vi.mocked(listStoredDocuments).mockResolvedValue({
      status: 200,
      data: [],
    } as never);
  });

  // The upload moved straight to the backend to clear the ~8KB edge limit, but
  // listing carries no body and must keep proxying: a signup mid-flow reads it
  // to show which documents are already stored.
  it("forwards a Firebase token when one is present", async () => {
    await GET(request("id-token"));

    expect(listStoredDocuments).toHaveBeenCalledWith({ idToken: "id-token" });
    expect(getSessionIds).not.toHaveBeenCalled();
  });

  it("falls back to the session user when there is no token", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({ userId: "user-1" } as never);

    await GET(request());

    expect(listStoredDocuments).toHaveBeenCalledWith({ userId: "user-1" });
  });
});
