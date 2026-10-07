import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/transcriptapi/route";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

vi.mock("@/lib/session", () => ({
  getSessionIds: vi
    .fn()
    .mockResolvedValue({ userId: "user-1", organizationId: "org-1" }),
}));
vi.mock("@/lib/transcriptapi", () => ({
  fetchMeetingTranscript: vi.fn(),
}));

describe("assistant transcript API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when transcript query params are missing", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/transcriptapi"),
    );

    expect(response.status).toBe(400);
    expect(fetchMeetingTranscript).not.toHaveBeenCalled();
  });

  it("forwards transcript responses with backend status", async () => {
    vi.mocked(fetchMeetingTranscript).mockResolvedValue({
      data: {
        segments: [{ id: "s1", speaker: "Ayse", text: "Hello", at: "00:01" }],
      },
      status: 200,
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/transcriptapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
      ),
    );

    expect(response.status).toBe(200);
    expect(fetchMeetingTranscript).toHaveBeenCalledWith(
      "google_meet",
      "abc-defg-hij",
    );
  });

  it("returns 502 when transcript backend call fails", async () => {
    vi.mocked(fetchMeetingTranscript).mockRejectedValue(new Error("boom"));

    const response = await GET(
      new NextRequest(
        "http://localhost/api/transcriptapi?platform=google_meet&nativeMeetingId=abc-defg-hij",
      ),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "Toplantı transkript hizmetine ulaşılamıyor.",
    });
  });
});
