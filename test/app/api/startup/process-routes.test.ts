import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/startup/process/assignments/[id]/submission/route";
import { GET } from "@/app/api/startup/process/route";
import {
  fetchStartupProcess,
  submitProcessAssignment,
} from "@/lib/api/startup-process";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionIds } from "@/lib/session";

vi.mock("@/lib/api/startup-process", () => ({
  fetchStartupProcess: vi.fn(),
  submitProcessAssignment: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSessionIds: vi.fn(),
}));

const ok = { status: 200, data: { organizationId: "org-1" }, headers: {} };

describe("startup process routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionIds).mockResolvedValue({
      userId: "user-1",
      organizationId: "org-1",
    });
  });

  it("reads the session startup's process", async () => {
    vi.mocked(fetchStartupProcess).mockResolvedValue(ok);

    const response = await GET();

    expect(fetchStartupProcess).toHaveBeenCalledWith("org-1", "user-1");
    expect(response.status).toBe(200);
  });

  it("asks for a session before reading the process", async () => {
    vi.mocked(getSessionIds).mockRejectedValue(new SessionRequiredError());

    const response = await GET();

    expect(response.status).toBe(401);
    expect(fetchStartupProcess).not.toHaveBeenCalled();
  });

  it("submits an Ödev as the session user", async () => {
    vi.mocked(submitProcessAssignment).mockResolvedValue(ok);

    await PUT(
      new NextRequest(
        "http://localhost/api/startup/process/assignments/odev-1/submission",
        { method: "PUT", body: JSON.stringify({ documentId: "doc-1" }) },
      ),
      { params: Promise.resolve({ id: "odev-1" }) },
    );

    expect(submitProcessAssignment).toHaveBeenCalledWith(
      "org-1",
      "odev-1",
      "user-1",
      "doc-1",
    );
  });
});
