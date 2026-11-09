import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/realtime/token/route";
import { issueRealtimeToken } from "@/lib/api/meeting-notes";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds, getSessionSignedInAt } from "@/lib/session";

vi.mock("@/lib/api/meeting-notes", () => ({
  issueRealtimeToken: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
  getSessionSignedInAt: vi.fn(),
}));

describe("/api/realtime/token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
    vi.mocked(getSessionSignedInAt).mockResolvedValue(1_762_589_730_123);
    vi.mocked(issueRealtimeToken).mockResolvedValue({
      data: { token: "t", expiresAt: "2026-11-08T08:16:30Z" },
      headers: {},
      status: 200,
    });
  });

  // The backend judges an admin's sign-in revoke against this, not against the socket a reconnect opens.
  it("asks for a token for the session's identity and sign-in", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(issueRealtimeToken).toHaveBeenCalledWith(
      { userId: "user-1", organizationId: "org-1" },
      1_762_589_730_123,
    );
  });

  it("issues nothing without a session", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await POST();

    expect(response.status).toBe(401);
    expect(issueRealtimeToken).not.toHaveBeenCalled();
  });
});
