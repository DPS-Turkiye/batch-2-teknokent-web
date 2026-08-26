import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/profile-analysis/route";
import { fetchLatestProfileAnalysis } from "@/lib/api/profile-analysis";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/profile-analysis", () => ({
  fetchLatestProfileAnalysis: vi.fn(),
  createProfileAnalysis: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

describe("/api/profile-analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("GET passes the appUserId query param through when present", async () => {
    vi.mocked(fetchLatestProfileAnalysis).mockResolvedValue({
      data: null,
      headers: {},
      status: 404,
    });

    await GET(
      new NextRequest(
        "http://localhost/api/profile-analysis?appUserId=member-1",
      ),
    );

    expect(fetchLatestProfileAnalysis).toHaveBeenCalledWith(
      "org-1",
      "member-1",
    );
  });

  it("GET omits appUserId when not present (self)", async () => {
    vi.mocked(fetchLatestProfileAnalysis).mockResolvedValue({
      data: null,
      headers: {},
      status: 404,
    });

    await GET(new NextRequest("http://localhost/api/profile-analysis"));

    expect(fetchLatestProfileAnalysis).toHaveBeenCalledWith("org-1", undefined);
  });

  // POST (multipart upload) is verified via live browser testing rather than
  // here: NextRequest.formData() under the project's jsdom test environment
  // doesn't interoperate with jsdom's File/FormData polyfills, so a File
  // parsed back out never satisfies `instanceof File` in the route handler.
});
