import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/profile-analysis/manual/route";
import { createManualProfileAnalysis } from "@/lib/api/profile-analysis";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/profile-analysis", () => ({
  createManualProfileAnalysis: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("POST /api/profile-analysis/manual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("forwards appUserId separately from the profile payload", async () => {
    vi.mocked(createManualProfileAnalysis).mockResolvedValue({
      data: {},
      headers: {},
      status: 201,
    });

    await POST(
      new NextRequest("http://localhost/api/profile-analysis/manual", {
        method: "POST",
        body: JSON.stringify({
          appUserId: "member-1",
          profileType: "mentee",
          profile: { startup_name: "Acme" },
        }),
      }),
    );

    expect(createManualProfileAnalysis).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      "member-1",
      { profileType: "mentee", profile: { startup_name: "Acme" } },
    );
  });

  it("passes undefined appUserId when creating for self", async () => {
    vi.mocked(createManualProfileAnalysis).mockResolvedValue({
      data: {},
      headers: {},
      status: 201,
    });

    await POST(
      new NextRequest("http://localhost/api/profile-analysis/manual", {
        method: "POST",
        body: JSON.stringify({
          profileType: "mentee",
          profile: { startup_name: "Acme" },
        }),
      }),
    );

    expect(createManualProfileAnalysis).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      undefined,
      { profileType: "mentee", profile: { startup_name: "Acme" } },
    );
  });
});
