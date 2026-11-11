import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/meetings/[id]/assistant-share/report-upload/route";
import { UserRole } from "@/interfaces/session";
import { createReportUpload } from "@/lib/api/meeting-notes";
import { requireMentorSession } from "@/lib/server/require-program-access";
import { guardRefusal } from "@test/fixtures/route-handlers";
import { appSession } from "@test/fixtures/session";

vi.mock("@/lib/api/meeting-notes", () => ({
  createReportUpload: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireMentorSession: vi.fn(),
}));

const params = Promise.resolve({ id: "meeting-1" });

describe("assistant share report upload API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a presigned upload URL for the signed-in mentor", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: true,
      session: appSession({
        userId: "mentor-1",
        email: "leyla@teknokent.demo",
        fullName: "Leyla Aksoy",
        jobTitle: "Mentor",
        role: UserRole.Mentor,
      }),
    });
    vi.mocked(createReportUpload).mockResolvedValue({
      data: {
        url: "https://s3.example/report-put",
        method: "PUT",
        key: "meetings/meeting-1/report.json",
        contentType: "application/json",
      },
      headers: {},
      status: 200,
    });

    const response = await POST(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(createReportUpload).toHaveBeenCalledWith("meeting-1", "mentor-1");
  });

  it("rejects a mentee", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue(guardRefusal(403));

    const response = await POST(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(403);
    expect(createReportUpload).not.toHaveBeenCalled();
  });
});
