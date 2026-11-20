import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/organizations/join/route";
import { UserRole, type AppSession } from "@/interfaces/session";
import { joinStartup } from "@/lib/api/organization";
import { getSessionUser, refreshSessionUser } from "@/lib/session";
import { backendRefusal } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/organization", () => ({
  joinStartup: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
  refreshSessionUser: vi.fn(),
}));

const withoutStartup: AppSession = {
  userId: "mentee-1",
  email: "zeynep@kargo.ai",
  fullName: "Zeynep Kaya",
  jobTitle: "Ürün",
  role: UserRole.Mentee,
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/organizations/join", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

describe("POST /api/organizations/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("joins as the session's person and answers with the refreshed session", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(withoutStartup);
    const user = {
      id: "mentee-1",
      email: "zeynep@kargo.ai",
      fullName: "Zeynep Kaya",
      role: UserRole.Mentee,
      organizationId: "org-1",
      organizationName: "Kargo AI",
    };
    vi.mocked(joinStartup).mockResolvedValue({
      status: 200,
      data: user,
      headers: {},
    });
    const refreshed = {
      ...withoutStartup,
      organizationId: "org-1",
      organizationName: "Kargo AI",
    };
    vi.mocked(refreshSessionUser).mockResolvedValue(refreshed);

    const response = await POST(request({ inviteCode: "KARGO1" }));

    expect(joinStartup).toHaveBeenCalledWith("mentee-1", "KARGO1", null);
    expect(refreshSessionUser).toHaveBeenCalledWith(user);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(refreshed);
  });

  it("passes the backend's refusal through and keeps the session as it was", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(withoutStartup);
    vi.mocked(joinStartup).mockResolvedValue(
      backendRefusal(400, {
        message: "Bu kod başka bir programdaki startup'a ait.",
      }),
    );

    const response = await POST(request({ inviteCode: "OTHER1" }));

    expect(response.status).toBe(400);
    expect(refreshSessionUser).not.toHaveBeenCalled();
  });

  it("refuses anyone who is not a signed-in mentee", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await POST(request({ inviteCode: "KARGO1" }));

    expect(response.status).toBe(401);
    expect(joinStartup).not.toHaveBeenCalled();
  });

  // The backend limits wrong codes per visitor; the address comes from the request, never from the browser's claim.
  it("names the address CloudFront saw, never one the browser claims", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(withoutStartup);
    vi.mocked(joinStartup).mockResolvedValue(backendRefusal(400));

    await POST(
      request(
        { inviteCode: "KARGO1" },
        {
          "cloudfront-viewer-address": "198.51.100.4:51544",
          "x-forwarded-for": "192.0.2.66",
          "x-menton-client-address": "1.2.3.4",
        },
      ),
    );

    expect(joinStartup).toHaveBeenCalledWith(
      "mentee-1",
      "KARGO1",
      "198.51.100.4",
    );
  });

  // A forged X-Forwarded-For naming someone else would spend their budget and lock them out.
  it("names no address from X-Forwarded-For alone", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(withoutStartup);
    vi.mocked(joinStartup).mockResolvedValue(backendRefusal(400));

    await POST(
      request({ inviteCode: "KARGO1" }, { "x-forwarded-for": "198.51.100.4" }),
    );

    expect(joinStartup).toHaveBeenCalledWith("mentee-1", "KARGO1", null);
  });
});
