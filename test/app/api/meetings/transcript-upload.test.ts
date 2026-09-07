import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/meetings/[id]/assistant-share/transcript-upload/route";
import { createTranscriptUpload } from "@/lib/api/meeting-notes";
import { requireMentorSession } from "@/lib/server/require-program-access";

vi.mock("@/lib/api/meeting-notes", () => ({
  createTranscriptUpload: vi.fn(),
}));

vi.mock("@/lib/server/require-program-access", () => ({
  requireMentorSession: vi.fn(),
}));

const params = Promise.resolve({ id: "meeting-1" });

describe("assistant share transcript upload API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a presigned upload URL for the signed-in mentor", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: true,
      session: {
        userId: "mentor-1",
        email: "leyla@teknokent.demo",
        fullName: "Leyla Aksoy",
        jobTitle: "Mentor",
        role: "MENTOR",
      },
    } as never);
    vi.mocked(createTranscriptUpload).mockResolvedValue({
      data: {
        url: "https://s3.example/put",
        method: "PUT",
        key: "meetings/meeting-1/transcript.json",
        contentType: "application/json",
      },
      headers: {},
      status: 200,
    });

    const response = await POST(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(createTranscriptUpload).toHaveBeenCalledWith(
      "meeting-1",
      "mentor-1",
    );
  });

  it("rejects a mentee", async () => {
    vi.mocked(requireMentorSession).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    });

    const response = await POST(new NextRequest("http://localhost/x"), {
      params,
    });

    expect(response.status).toBe(403);
    expect(createTranscriptUpload).not.toHaveBeenCalled();
  });
});
