import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/startup/documents/route";
import { fetchStartupDocuments } from "@/lib/api/startup-documents";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/startup-documents", () => ({
  fetchStartupDocuments: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("/api/startup/documents", () => {
  beforeEach(() => {
    vi.mocked(fetchStartupDocuments).mockReset();
    vi.mocked(getSessionIds).mockReset();
  });

  it("lists the session startup's documents on behalf of the session user", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
    vi.mocked(fetchStartupDocuments).mockResolvedValue({
      status: 200,
      data: [{ id: "doc-1" }],
      headers: {},
    } as never);

    const response = await GET();

    expect(fetchStartupDocuments).toHaveBeenCalledWith("org-1", "user-1");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "doc-1" }]);
  });

  it("asks for a session when there is none", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchStartupDocuments).not.toHaveBeenCalled();
  });
});
