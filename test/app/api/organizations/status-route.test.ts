import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/organizations/status/route";
import { updateOrganizationStatus } from "@/lib/api/organization";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/organization", () => ({
  updateOrganizationStatus: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const status = {
  statusVersion: "v0.9.2",
  statusSummary: "Öğretmen modülü geliştirme aşamasında.",
  completionPercent: 72,
};

function request() {
  return new Request("http://localhost/api/organizations/status", {
    method: "PUT",
    body: JSON.stringify(status),
  });
}

describe("/api/organizations/status", () => {
  beforeEach(() => {
    vi.mocked(updateOrganizationStatus).mockReset();
    vi.mocked(getSessionIds).mockReset();
  });

  it("saves the status as the session user for the session startup", async () => {
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
    vi.mocked(updateOrganizationStatus).mockResolvedValue({
      status: 200,
      data: { id: "org-1", ...status },
      headers: {},
    } as never);

    const response = await PUT(request());

    expect(updateOrganizationStatus).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      status,
    );
    expect(response.status).toBe(200);
  });

  it("asks for a session when there is none", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await PUT(request());

    expect(response.status).toBe(401);
    expect(updateOrganizationStatus).not.toHaveBeenCalled();
  });
});
